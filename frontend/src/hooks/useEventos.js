import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useEventos() {
  const [eventos, setEventos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    async function buscarEventos() {
      const { data, error } = await supabase
        .from('evento')
        .select('*')
        .order('data_inicio', { ascending: true })

      if (error) {
        setErro(error.message)
      } else {
        setEventos(data)
      }
      setCarregando(false)
    }

    buscarEventos()
  }, [])

  return { eventos, carregando, erro }
}