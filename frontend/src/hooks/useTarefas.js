import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useTarefas(eventoId) {
  const [tarefas, setTarefas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarTarefas = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)

    // Tarefas sem prazo vão para o fim da lista.
    const { data, error } = await supabase
      .from('tarefa')
      .select('*')
      .eq('evento_id', eventoId)
      .order('prazo', { ascending: true, nullsFirst: false })
      .order('criado_em', { ascending: true })

    if (error) {
      setErro(error.message)
    } else {
      setTarefas(data)
    }
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarTarefas()
  }, [buscarTarefas])

  return { tarefas, carregando, erro, recarregar: buscarTarefas }
}
