import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Mensagens do SAC do usuário logado (RF22), da mais nova para a mais antiga.
// O RLS já filtra pelo dono; o status e a resposta são mudados pela equipe
// no painel do Supabase.
export function useSac() {
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarMensagens = useCallback(async () => {
    setCarregando(true)
    const { data, error } = await supabase
      .from('mensagem_sac')
      .select('id, assunto, mensagem, status, resposta, criado_em')
      .order('criado_em', { ascending: false })

    if (error) {
      setErro(mensagemDeErro(error, 'carregar suas solicitações'))
    } else {
      setErro(null)
      setMensagens(data)
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarMensagens()
  }, [buscarMensagens])

  // Devolve null se deu certo ou o texto do erro para mostrar no formulário.
  const enviar = useCallback(
    async (dados) => {
      const { error } = await supabase.from('mensagem_sac').insert(dados)
      if (error) return mensagemDeErro(error, 'enviar sua mensagem')
      await buscarMensagens()
      return null
    },
    [buscarMensagens]
  )

  return { mensagens, carregando, erro, recarregar: buscarMensagens, enviar }
}

// P0001 é o limite de envio (trigger limitar_envio_mensagem_sac), que já
// vem com o texto para o usuário. Sem código, a requisição nem chegou ao
// servidor (sem internet, por exemplo).
function mensagemDeErro(error, acao) {
  if (error.code === 'P0001') return error.message
  if (!error.code) return `Não foi possível ${acao}. Verifique sua conexão e tente novamente.`
  return `Não foi possível ${acao}. Tente novamente em instantes.`
}
