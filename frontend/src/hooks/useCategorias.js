import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Categorias de tarefa do usuário logado. O RLS já filtra pelo dono,
// então a busca não precisa de .eq('usuario_id', …).
export function useCategorias() {
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarCategorias = useCallback(async () => {
    setCarregando(true)

    const { data, error } = await supabase
      .from('categoria_tarefa')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      setErro(error.message)
    } else {
      setErro(null)
      setCategorias(data)
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarCategorias()
  }, [buscarCategorias])

  const executar = useCallback(
    async (consulta) => {
      const { error } = await consulta
      if (error) return error.message
      await buscarCategorias()
      return null
    },
    [buscarCategorias]
  )

  const criar = useCallback((dados) => executar(supabase.from('categoria_tarefa').insert(dados)), [executar])
  const editar = useCallback((id, dados) => executar(supabase.from('categoria_tarefa').update(dados).eq('id', id)), [executar])
  const remover = useCallback((id) => executar(supabase.from('categoria_tarefa').delete().eq('id', id)), [executar])

  return { categorias, carregando, erro, recarregar: buscarCategorias, criar, editar, remover }
}
