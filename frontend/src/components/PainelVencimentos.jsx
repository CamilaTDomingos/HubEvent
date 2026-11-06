import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useVencimentos } from '../hooks/useVencimentos'
import { diasAte, formatar, moeda, rotuloContagem } from '../utils/datas'
import Icone from './Icone'
import './PainelVencimentos.css'

const FILTROS = [
  { id: 'todos', label: 'Tudo' },
  { id: 'pagamento', label: 'Pagamentos' },
  { id: 'tarefa', label: 'Tarefas' },
]

function urgencia(dias) {
  if (dias < 0) return 'atrasado'
  if (dias <= 3) return 'urgente'
  if (dias <= 7) return 'semana'
  return 'normal'
}

function PainelVencimentos() {
  const { itens, carregando } = useVencimentos()
  const [filtro, setFiltro] = useState('todos')

  if (carregando) return null

  const visiveis = itens.filter((i) => filtro === 'todos' || i.tipo === filtro)
  const atrasados = itens.filter((i) => diasAte(i.data) < 0).length

  return (
    <section className="venc rv" style={{ '--d': 3 }}>
      <div className="secao-cab">
        <h2>
          Para vencer
          {atrasados > 0 && <span className="venc-alerta">{atrasados} em atraso</span>}
        </h2>
        <div className="venc-filtros" role="group" aria-label="Filtrar vencimentos">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filtro === f.id ? 'ativo' : ''}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="dash-nada">Nada vencendo nos próximos 30 dias. Tudo em dia!</p>
      ) : (
        <ul className="venc-lista">
          {visiveis.slice(0, 8).map((item) => {
            const dias = diasAte(item.data)
            return (
              <li key={item.chave}>
                <Link
                  to={`/eventos/${item.eventoId}`}
                  state={{ aba: item.aba }}
                  className={`venc-item ${urgencia(dias)}`}
                >
                  <span className="venc-icone">
                    <Icone nome={item.tipo === 'pagamento' ? 'carteira' : 'check'} tamanho={16} />
                  </span>
                  <span className="venc-texto">
                    <strong>{item.titulo}</strong>
                    <small>{item.eventoNome}</small>
                  </span>
                  <span className="venc-quando">
                    {item.valor != null && <span className="num venc-valor">{moeda(item.valor)}</span>}
                    <span className="venc-data">
                      {formatar(item.data, { day: '2-digit', month: 'short' })} · {rotuloContagem(item.data)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default PainelVencimentos
