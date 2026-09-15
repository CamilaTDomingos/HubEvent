import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useDespesas(eventoId) {
  const [despesas, setDespesas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarDespesas = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)

    const { data, error } = await supabase
      .from('despesa')
      .select('*')
      .eq('evento_id', eventoId)
      .order('criado_em', { ascending: false })

    if (error) {
      setErro(error.message)
    } else {
      setDespesas(data)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarDespesas()
  }, [buscarDespesas])

  return { despesas, carregando, erro, recarregar: buscarDespesas }
}