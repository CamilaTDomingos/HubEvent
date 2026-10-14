import express from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { exigirLogin } from '../middlewares/exigirLogin.js'
import { montarContexto } from '../services/contextoEvento.js'
import { consumirUso } from '../services/limiteUso.js'
import { ErroAssistente, geminiConfigurado, modeloGemini, perguntarAoGemini } from '../services/gemini.js'

// Assistente de IA de planejamento (RF02 / RF15). Só o organizador do evento
// conversa com ele. O histórico fica em mensagem_chat, e o frontend o lê
// direto do Supabase (RLS); aqui só passa o que precisa da chave do Gemini.

const router = express.Router()

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_MENSAGEM = 2000
const MENSAGENS_DE_CONTEXTO = 12

// Atalhos rápidos do chat. O balão do usuário mostra o rótulo; a IA recebe
// a instrução completa.
export const ATALHOS = {
  checklist: {
    rotulo: 'Sugerir checklist',
    instrucao:
      'Sugira as tarefas que ainda faltam no checklist deste evento, com prazos realistas até a data do evento. ' +
      'Não repita tarefas que já estão no checklist. Na resposta, explique em poucas linhas a lógica da lista.',
  },
  cronograma: {
    rotulo: 'Montar cronograma',
    instrucao:
      'Monte um cronograma de preparação do evento, de hoje até a data, agrupado por semana ou por mês conforme o tempo que falta, ' +
      'e um roteiro do dia do evento por horário. Devolva as etapas de preparação também como tarefas com prazo.',
  },
  comida: {
    rotulo: 'Estimar comida e bebida',
    instrucao:
      'Estime as quantidades de comida e bebida para o evento. Use os confirmados como base e some uma parte dos pendentes; ' +
      'diga quantas pessoas considerou e por quê. Dê a quantidade por pessoa e o total de cada item que combina com o tipo e o horário do evento ' +
      '(por exemplo salgados, prato principal, doces, bolo, refrigerante, água, suco, cerveja), com uma margem de segurança. ' +
      'Se não houver convidados cadastrados, peça o número de pessoas. Sugira como tarefas as compras e encomendas.',
  },
  fornecedores: {
    rotulo: 'Fornecedores',
    instrucao:
      'Liste os tipos de fornecedor que este evento precisa (por exemplo buffet, decoração, fotografia, som), ' +
      'o que perguntar a cada um ao pedir orçamento e com quanta antecedência contratar. Não invente nomes de empresas nem preços exatos. ' +
      'Devolva a contratação de cada fornecedor como tarefa com prazo.',
  },
  convite: {
    rotulo: 'Redigir convite',
    instrucao:
      'Escreva um texto curto de convite para este evento, pronto para mandar por WhatsApp, com data, horário e local. ' +
      'Use [nome do convidado] onde o organizador vai personalizar. Não sugira tarefas.',
  },
}

function instrucoesDoSistema(contexto) {
  return [
    'Você é o Assistente HubEvent, que ajuda organizadores a planejar eventos (festas, casamentos, aniversários, chás, formaturas, eventos corporativos).',
    'Responda sempre em português do Brasil, com tom acolhedor e direto, em poucos parágrafos curtos. Pode usar listas com "- " no começo da linha. Não use Markdown (nada de asteriscos, # ou tabelas).',
    'Baseie-se nos dados do evento abaixo. Se faltar alguma informação importante, diga o que falta em vez de inventar. Valores em dinheiro são sempre estimativas: dê faixas e diga que variam por região.',
    'Quando sugerir ações concretas para o checklist, devolva-as no campo "tarefas" (no máximo 15), cada uma com um título curto começando por verbo. ' +
      'O prazo, quando houver, vai no formato AAAA-MM-DD, entre hoje e o dia do evento. A categoria deve ser exatamente uma das categoriasDeTarefa, ou vazia. ' +
      'Não repita tarefas que já estão no checklist. Se a resposta não sugerir tarefas, devolva "tarefas" vazio.',
    'Você não recebe nomes nem contatos de convidados e não deve pedi-los.',
    '',
    'Dados do evento (JSON):',
    JSON.stringify(contexto),
  ].join('\n')
}

function responderErro(res, erro) {
  if (erro instanceof ErroAssistente) {
    return res.status(erro.status).json({ error: erro.message, codigo: erro.codigo })
  }
  console.error('[assistente]', erro)
  return res.status(500).json({ error: 'Algo deu errado no servidor. Tente de novo.', codigo: 'ERRO_SERVIDOR' })
}

// Envia uma pergunta (texto livre ou atalho) e grava a pergunta e a resposta.
// Corpo: { mensagem } ou { atalho }. Se a IA falhar, nada é gravado, então o
// frontend pode simplesmente tentar de novo.
router.post('/:eventoId/mensagens', exigirLogin, async (req, res) => {
  const { eventoId } = req.params
  const usuarioId = req.usuario.id

  const atalho = typeof req.body?.atalho === 'string' ? ATALHOS[req.body.atalho] : null
  const texto = typeof req.body?.mensagem === 'string' ? req.body.mensagem.trim() : ''
  if (!atalho && !texto) {
    return res.status(400).json({ error: 'Escreva uma mensagem para o assistente.', codigo: 'MENSAGEM_VAZIA' })
  }
  if (!atalho && texto.length > MAX_MENSAGEM) {
    return res.status(400).json({ error: `A mensagem passou de ${MAX_MENSAGEM} caracteres.`, codigo: 'MENSAGEM_LONGA' })
  }

  try {
    // Só o organizador: para qualquer outra pessoa o evento "não existe".
    const { data: evento, error: erroEvento } = UUID.test(eventoId)
      ? await supabaseAdmin.from('evento').select('*').eq('id', eventoId).maybeSingle()
      : { data: null, error: null }
    if (erroEvento) throw new Error(erroEvento.message)
    if (!evento || evento.organizador_id !== usuarioId) {
      return res.status(404).json({ error: 'Evento não encontrado.', codigo: 'SEM_EVENTO' })
    }

    if (!geminiConfigurado()) {
      throw new ErroAssistente('SEM_CHAVE', 503, 'O assistente ainda não foi configurado no servidor (falta a chave do Gemini).')
    }

    const uso = consumirUso(usuarioId)
    if (!uso.permitido) {
      res.set('Retry-After', String(uso.esperarSegundos))
      const espera = uso.doDia ? 'amanhã' : `em ${uso.esperarSegundos} s`
      return res.status(429).json({
        error: `Você fez muitas perguntas seguidas ao assistente. Tente de novo ${espera}.`,
        codigo: 'LIMITE_USUARIO',
        esperarSegundos: uso.esperarSegundos,
      })
    }

    // Um assistente por evento, criado na primeira conversa.
    const { data: assistente, error: erroAssistente } = await supabaseAdmin
      .from('assistente_ia')
      .upsert({ evento_id: eventoId, modelo: modeloGemini() }, { onConflict: 'evento_id' })
      .select('id, ativo')
      .single()
    if (erroAssistente) throw new Error(erroAssistente.message)
    if (!assistente.ativo) {
      return res.status(403).json({ error: 'O assistente está desativado para este evento.', codigo: 'ASSISTENTE_INATIVO' })
    }

    const [{ data: anteriores, error: erroHistorico }, contexto] = await Promise.all([
      supabaseAdmin
        .from('mensagem_chat')
        .select('tipo, conteudo')
        .eq('assistente_id', assistente.id)
        .in('tipo', ['USUARIO', 'IA'])
        .order('criado_em', { ascending: false })
        .limit(MENSAGENS_DE_CONTEXTO),
      montarContexto(evento),
    ])
    if (erroHistorico) throw new Error(erroHistorico.message)

    const historico = anteriores.reverse().map((m) => ({ papel: m.tipo === 'IA' ? 'ia' : 'usuario', texto: m.conteudo }))
    const { resposta, tarefas } = await perguntarAoGemini({
      instrucoes: instrucoesDoSistema(contexto),
      historico,
      pergunta: atalho ? atalho.instrucao : texto,
    })

    // Horários explícitos: as duas linhas entram no mesmo comando e o NOW()
    // seria igual, o que embaralharia a ordem do histórico.
    const agora = Date.now()
    const { data: gravadas, error: erroGravar } = await supabaseAdmin
      .from('mensagem_chat')
      .insert([
        { assistente_id: assistente.id, usuario_id: usuarioId, tipo: 'USUARIO', conteudo: atalho ? atalho.rotulo : texto, criado_em: new Date(agora).toISOString() },
        {
          assistente_id: assistente.id,
          usuario_id: usuarioId,
          tipo: 'IA',
          conteudo: resposta,
          dados: tarefas.length ? { tarefas, adicionadas: [] } : null,
          criado_em: new Date(agora + 1).toISOString(),
        },
      ])
      .select('id, tipo, conteudo, dados, criado_em')
    if (erroGravar) throw new Error(erroGravar.message)

    gravadas.sort((a, b) => Date.parse(a.criado_em) - Date.parse(b.criado_em))
    res.json({ mensagens: gravadas })
  } catch (erro) {
    responderErro(res, erro)
  }
})

export default router
