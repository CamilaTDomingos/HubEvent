import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Participantes, cotas personalizadas e acertos do rateio de um evento (RF03).
// `despesas` entra como dependência: lançar ou excluir uma despesa refaz a busca
// (as cotas de uma despesa apagada somem junto com ela).
export function useRateio(eventoId, despesas) {
  const [participantes, setParticipantes] = useState([])
  const [cotas, setCotas] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarRateio = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)

    const [rParticipantes, rCotas, rPagamentos] = await Promise.all([
      supabase
        .from('participante_rateio')
        .select('*')
        .eq('evento_id', eventoId)
        .order('organizador', { ascending: false })
        .order('criado_em', { ascending: true }),
      supabase
        .from('cota_despesa')
        .select('despesa_id, participante_id, valor, percentual, despesa!inner(evento_id)')
        .eq('despesa.evento_id', eventoId),
      supabase
        .from('pagamento_rateio')
        .select('*')
        .eq('evento_id', eventoId)
        .order('pago_em', { ascending: false })
        .order('criado_em', { ascending: false }),
    ])

    const falha = rParticipantes.error || rCotas.error || rPagamentos.error
    if (falha) {
      setErro(falha.message)
    } else {
      setErro(null)
      setParticipantes(rParticipantes.data)
      setCotas(rCotas.data)
      setPagamentos(rPagamentos.data)
    }
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarRateio()
  }, [buscarRateio, despesas])

  return { participantes, cotas, pagamentos, carregando, erro, recarregar: buscarRateio }
}
