import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Conversa com o assistente de IA de um evento. O histórico vem direto do
// Supabase (RLS); as perguntas vão para o backend, que guarda a chave do
// Gemini, confere se quem pergunta é o organizador e grava as mensagens.

const TEMPO_LIMITE_MS = 45000

async function lerErro(res) {
  try {
    const corpo = await res.json()
    return corpo.error || null
  } catch {
    return null
  }
}

export function useAssistente(eventoId) {
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroHistorico, setErroHistorico] = useState(null)
  const [pendente, setPendente] = useState(null) // pergunta enviada, à espera da IA
  const [falha, setFalha] = useState(null) // { mensagem, pedido } para tentar de novo

  const buscarHistorico = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErroHistorico(null)

    const { data: assistente, error } = await supabase
      .from('assistente_ia')
      .select('id')
      .eq('evento_id', eventoId)
      .maybeSingle()

    if (error) {
      setErroHistorico('Não foi possível carregar a conversa.')
    } else if (!assistente) {
      setMensagens([])
    } else {
      const { data, error: erroMensagens } = await supabase
        .from('mensagem_chat')
        .select('*')
        .eq('assistente_id', assistente.id)
        .order('criado_em', { ascending: true })
      if (erroMensagens) setErroHistorico('Não foi possível carregar a conversa.')
      else setMensagens(data)
    }
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarHistorico()
  }, [buscarHistorico])

  // pedido: { mensagem } (texto livre) ou { atalho, rotulo } (atalho rápido)
  const enviar = useCallback(
    async (pedido) => {
      setFalha(null)
      setPendente(pedido.rotulo || pedido.mensagem)

      let mensagemErro = null
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) throw new Error('Sua sessão expirou. Entre de novo para continuar.')

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assistente/${eventoId}/mensagens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(pedido.atalho ? { atalho: pedido.atalho } : { mensagem: pedido.mensagem }),
          signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
        })

        if (!res.ok) {
          mensagemErro = (await lerErro(res)) || 'O assistente não respondeu. Tente de novo.'
        } else {
          const corpo = await res.json()
          setMensagens((atuais) => [...atuais, ...corpo.mensagens])
        }
      } catch (erro) {
        if (erro.name === 'TimeoutError') mensagemErro = 'O assistente demorou demais para responder. Tente de novo.'
        else if (erro instanceof TypeError) mensagemErro = 'Não foi possível falar com o servidor. Confira sua conexão e tente de novo.'
        else mensagemErro = erro.message
      }

      if (mensagemErro) setFalha({ mensagem: mensagemErro, pedido })
      setPendente(null)
      return !mensagemErro
    },
    [eventoId]
  )

  const tentarDeNovo = useCallback(() => {
    if (falha) enviar(falha.pedido)
  }, [falha, enviar])

  // Leva as tarefas escolhidas (índices em dados.tarefas) para o checklist
  // e marca na mensagem quais já foram, para não oferecer de novo.
  const adicionarTarefas = useCallback(
    async (mensagem, indices, categorias) => {
      const porNome = Object.fromEntries(categorias.map((c) => [c.nome.toLocaleLowerCase('pt-BR'), c.id]))
      const linhas = indices.map((i) => {
        const t = mensagem.dados.tarefas[i]
        return {
          evento_id: eventoId,
          titulo: t.titulo,
          descricao: t.descricao || null,
          prazo: t.prazo || null,
          categoria_id: porNome[(t.categoria || '').toLocaleLowerCase('pt-BR')] || null,
        }
      })

      const { error } = await supabase.from('tarefa').insert(linhas)
      if (error) return 'Não foi possível adicionar as tarefas ao checklist.'

      const dados = { ...mensagem.dados, adicionadas: [...new Set([...(mensagem.dados.adicionadas || []), ...indices])] }
      setMensagens((atuais) => atuais.map((m) => (m.id === mensagem.id ? { ...m, dados } : m)))
      // Se esta marcação falhar, as tarefas já estão no checklist; só a
      // indicação "já adicionada" se perde ao reabrir a conversa.
      await supabase.from('mensagem_chat').update({ dados }).eq('id', mensagem.id)
      return null
    },
    [eventoId]
  )

  return { mensagens, carregando, erroHistorico, recarregar: buscarHistorico, pendente, falha, enviar, tentarDeNovo, adicionarTarefas }
}
