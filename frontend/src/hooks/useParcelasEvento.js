import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Todas as parcelas das despesas de um evento, para o fluxo de caixa.
// `despesas` entra como dependência: lançar ou excluir uma despesa refaz a busca.
export function useParcelasEvento(eventoId, despesas) {
  const [parcelas, setParcelas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscarParcelas = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)

    const { data, error } = await supabase
      .from('parcela')
      .select('despesa_id, valor, vencimento, pago, despesa!inner(evento_id)')
      .eq('despesa.evento_id', eventoId)
      .order('vencimento', { ascending: true })

    if (!error) setParcelas(data)
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarParcelas()
  }, [buscarParcelas, despesas])

  return { parcelas, carregando, recarregar: buscarParcelas }
}
