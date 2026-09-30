import { useEffect, useState } from 'react'
import { corDespesa } from '../utils/categorias'
import { moeda } from '../utils/datas'

function GraficoDespesas({ despesas }) {
  const [animado, setAnimado] = useState(false)
  const [ativo, setAtivo] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setAnimado(true), 100)
    return () => clearTimeout(t)
  }, [])

  const porCategoria = despesas.reduce((acc, d) => {
    const cat = d.categoria || 'Sem categoria'
    acc[cat] = (acc[cat] || 0) + Number(d.valor_total)
    return acc
  }, {})

  const total = Object.values(porCategoria).reduce((a, b) => a + b, 0)
  const entradas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])

  if (total === 0) {
    return (
      <div className="grafico-vazio">
        <svg width="150" height="150" viewBox="0 0 180 180" aria-hidden="true">
          <circle cx="90" cy="90" r="70" fill="none" stroke="var(--line-2)" strokeWidth="22" strokeDasharray="4 6" />
        </svg>
        <p>Lance a primeira despesa e o gráfico ganha vida.</p>
      </div>
    )
  }

  const raio = 70
  const circunferencia = 2 * Math.PI * raio

  // Pré-calcula os offsets de forma pura antes do render do JSX
  const segmentos = entradas.reduce((acc, [categoria, valor], i) => {
    const fracao = valor / total
    const tamanho = fracao * circunferencia
    const offset = acc.offset

    acc.segmentos.push({ categoria, valor, i, tamanho, offset })

    return { segmentos: acc.segmentos, offset: offset + tamanho }
  }, { segmentos: [], offset: 0 }).segmentos

  const destaque = ativo ? entradas.find(([c]) => c === ativo) : null

  return (
    <div className="grafico">
      <div className="grafico-rosca">
        <svg viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx="90" cy="90" r={raio} fill="none" stroke="var(--paper-2)" strokeWidth="24" />
          {segmentos.map(({ categoria, i, tamanho, offset }) => (
            <circle
              key={categoria}
              cx="90"
              cy="90"
              r={raio}
              fill="none"
              stroke={corDespesa(categoria)}
              strokeWidth={ativo === categoria ? 30 : 24}
              strokeDasharray={`${animado ? tamanho : 0} ${circunferencia}`}
              strokeDashoffset={-offset}
              opacity={ativo && ativo !== categoria ? 0.22 : 1}
              onMouseEnter={() => setAtivo(categoria)}
              onMouseLeave={() => setAtivo(null)}
              style={{
                cursor: 'pointer',
                transition: `stroke-dasharray 900ms var(--ease) ${i * 90}ms, opacity 200ms, stroke-width 250ms var(--spring)`,
              }}
            />
          ))}
        </svg>
        <div className="grafico-centro">
          {destaque ? (
            <>
              <strong className="display">{((destaque[1] / total) * 100).toFixed(0)}%</strong>
              <span className="mono">{moeda(destaque[1], 0)}</span>
            </>
          ) : (
            <>
              <strong className="display">{moeda(total, 0)}</strong>
              <span className="mono">gasto total</span>
            </>
          )}
        </div>
      </div>

      <ul className="grafico-legenda">
        {entradas.map(([categoria, valor]) => (
          <li
            key={categoria}
            className={ativo && ativo !== categoria ? 'apagado' : ''}
            onMouseEnter={() => setAtivo(categoria)}
            onMouseLeave={() => setAtivo(null)}
          >
            <span className="grafico-cor" style={{ background: corDespesa(categoria) }} />
            <span className="grafico-cat">{categoria}</span>
            <span className="mono num">{((valor / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GraficoDespesas
