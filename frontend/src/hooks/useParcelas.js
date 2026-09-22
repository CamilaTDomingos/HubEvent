import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useParcelas(despesaId) {
  const [parcelas, setParcelas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscarParcelas = useCallback(async () => {
    if (!despesaId) return
    setCarregando(true)

    const { data, error } = await supabase
      .from('parcela')
      .select('*')
      .eq('despesa_id', despesaId)
      .order('numero', { ascending: true })

    if (!error) setParcelas(data)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarregando(false)
  }, [despesaId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarParcelas()
  }, [buscarParcelas])

  return { parcelas, carregando, recarregar: buscarParcelas }
}