import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { diasAte } from '../utils/datas'

const JANELA_DIAS = 30

// Parcelas não pagas e tarefas não concluídas, de todos os eventos do usuário,
// que estão atrasadas ou vencem nos próximos 30 dias. Ordenadas por data.
export function useVencimentos() {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    async function buscar() {
      const [parcelas, tarefas] = await Promise.all([
        supabase
          .from('parcela')
          .select('id, valor, vencimento, numero, despesa!inner(id, descricao, evento_id, evento(nome))')
          .eq('pago', false)
          .not('vencimento', 'is', null),
        supabase
          .from('tarefa')
          .select('id, titulo, prazo, status, evento_id, evento(nome)')
          .neq('status', 'CONCLUIDA')
          .not('prazo', 'is', null),
      ])

      if (!ativo) return

      const lista = [
        ...(parcelas.data ?? []).map((p) => ({
          chave: `p${p.id}`,
          tipo: 'pagamento',
          titulo: p.despesa.descricao,
          data: p.vencimento,
          valor: p.valor,
          eventoId: p.despesa.evento_id,
          eventoNome: p.despesa.evento?.nome,
          aba: 'financeiro',
        })),
        ...(tarefas.data ?? []).map((t) => ({
          chave: `t${t.id}`,
          tipo: 'tarefa',
          titulo: t.titulo,
          data: t.prazo,
          eventoId: t.evento_id,
          eventoNome: t.evento?.nome,
          aba: 'checklist',
        })),
      ]
        .filter((i) => diasAte(i.data) <= JANELA_DIAS)
        .sort((a, b) => diasAte(a.data) - diasAte(b.data))

      setItens(lista)
      setCarregando(false)
    }

    buscar()
    return () => { ativo = false }
  }, [])

  return { itens, carregando }
}
