import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useConvidados(eventoId) {
  const [convidados, setConvidados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarConvidados = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)

    const { data, error } = await supabase
      .from('convidado')
      .select('*')
      .eq('evento_id', eventoId)
      .order('nome', { ascending: true })

    if (error) {
      setErro(error.message)
    } else {
      setConvidados(data)
    }
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarConvidados()
  }, [buscarConvidados])

  return { convidados, carregando, erro, recarregar: buscarConvidados }
}