import { supabaseAdmin } from './supabaseAdmin.js'

// Resumo do evento que vai para a IA. Por privacidade (LGPD), só entram
// dados agregados: contagens, totais e títulos de tarefas. Nome, e-mail ou
// qualquer outro dado de convidado nunca sai daqui.

const FUSO = 'America/Sao_Paulo'
const MAX_TAREFAS = 80

// "2026-12-10 19:00" no horário de Brasília.
function dataHora(iso) {
  if (!iso) return null
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(iso)).map((p) => [p.type, p.value])
  )
  return `${partes.year}-${partes.month}-${partes.day} ${partes.hour}:${partes.minute}`
}

export const hojeEmBrasilia = (agora = new Date()) => dataHora(agora.toISOString()).slice(0, 10)

const somar = (lista, campo) => Math.round(lista.reduce((s, item) => s + (Number(item[campo]) || 0), 0) * 100) / 100

function contar(lista, teste) {
  return lista.filter(teste).length
}

export async function montarContexto(evento, agora = new Date()) {
  const id = evento.id
  const [convidados, despesas, tarefas, presentes, categorias] = await Promise.all([
    supabaseAdmin.from('convidado').select('status_presenca, acompanhantes_confirmados').eq('evento_id', id),
    supabaseAdmin.from('despesa').select('valor_total, pago, categoria_despesa:categoria_id (nome)').eq('evento_id', id),
    supabaseAdmin
      .from('tarefa')
      .select('titulo, status, prazo, categoria:categoria_id (nome)')
      .eq('evento_id', id)
      .order('prazo', { ascending: true, nullsFirst: false })
      .limit(MAX_TAREFAS),
    supabaseAdmin.from('lista_presentes').select('quantidade, valor').eq('evento_id', id),
    supabaseAdmin.from('categoria_tarefa').select('nome').eq('usuario_id', evento.organizador_id).order('nome'),
  ])

  const falha = [convidados, despesas, tarefas, presentes, categorias].find((r) => r.error)
  if (falha) throw new Error(falha.error.message)

  const listaConvidados = convidados.data
  const listaDespesas = despesas.data
  const listaTarefas = tarefas.data
  const orcamento = Number(evento.orcamento_estimado) || null
  const totalGasto = somar(listaDespesas, 'valor_total')

  const porCategoria = {}
  for (const d of listaDespesas) {
    const nome = d.categoria_despesa?.nome || 'Sem categoria'
    porCategoria[nome] = Math.round(((porCategoria[nome] || 0) + Number(d.valor_total || 0)) * 100) / 100
  }

  const hoje = hojeEmBrasilia(agora)
  const inicio = dataHora(evento.data_inicio)
  const dias = inicio ? Math.round((Date.parse(`${inicio.slice(0, 10)}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000) : null

  return {
    hoje,
    evento: {
      nome: evento.nome,
      tipo: evento.categoria || null,
      inicio,
      fim: dataHora(evento.data_fim),
      local: evento.local || null,
      diasAteOEvento: dias,
      orcamentoEstimado: orcamento,
    },
    convidados: {
      total: listaConvidados.length,
      confirmados: contar(listaConvidados, (c) => c.status_presenca === 'CONFIRMADO'),
      pendentes: contar(listaConvidados, (c) => c.status_presenca === 'PENDENTE'),
      recusados: contar(listaConvidados, (c) => c.status_presenca === 'RECUSADO'),
      // Titulares confirmados + acompanhantes: é o número para buffet e bebidas.
      pessoasConfirmadas: listaConvidados
        .filter((c) => c.status_presenca === 'CONFIRMADO')
        .reduce((soma, c) => soma + 1 + (c.acompanhantes_confirmados ?? 0), 0),
    },
    financeiro: {
      despesas: listaDespesas.length,
      totalGasto,
      totalPago: somar(listaDespesas.filter((d) => d.pago), 'valor_total'),
      porCategoria,
      saldoDoOrcamento: orcamento ? Math.round((orcamento - totalGasto) * 100) / 100 : null,
    },
    checklist: {
      total: listaTarefas.length,
      concluidas: contar(listaTarefas, (t) => t.status === 'CONCLUIDA'),
      tarefas: listaTarefas.map((t) => ({
        titulo: t.titulo,
        status: t.status,
        prazo: t.prazo,
        categoria: t.categoria?.nome || null,
      })),
    },
    presentes: {
      itens: presentes.data.length,
      unidades: presentes.data.reduce((s, p) => s + (p.quantidade || 1), 0),
    },
    categoriasDeTarefa: categorias.data.map((c) => c.nome),
  }
}
