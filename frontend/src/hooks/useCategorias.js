import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Categorias do usuário logado: 'categoria_tarefa' (checklist) ou
// 'categoria_despesa' (financeiro). O RLS já filtra pelo dono, então a busca
// não precisa de .eq('usuario_id', …).
export function useCategorias(tabela = 'categoria_tarefa') {
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarCategorias = useCallback(async () => {
    setCarregando(true)

    const { data, error } = await supabase
      .from(tabela)
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      setErro(error.message)
    } else {
      setErro(null)
      setCategorias(data)
    }
    setCarregando(false)
  }, [tabela])

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

  const criar = useCallback((dados) => executar(supabase.from(tabela).insert(dados)), [tabela, executar])
  const editar = useCallback((id, dados) => executar(supabase.from(tabela).update(dados).eq('id', id)), [tabela, executar])
  const remover = useCallback((id) => executar(supabase.from(tabela).delete().eq('id', id)), [tabela, executar])

  return { categorias, carregando, erro, recarregar: buscarCategorias, criar, editar, remover }
}
