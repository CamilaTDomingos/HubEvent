import { useEffect, useState } from 'react'

const CORES = ['#16a37a', '#3b6fe8', '#e8a432', '#e5484d', '#8b5cf6', '#06b6d4', '#f97316', '#64748b']

function GraficoDespesas({ despesas }) {
  const [animado, setAnimado] = useState(false)

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
      <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Lance despesas para ver a distribuição por categoria.
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

    acc.segmentos.push({
      categoria,
      valor,
      i,
      tamanho,
      offset
    })

    return { segmentos: acc.segmentos, offset: offset + tamanho }
  }, { segmentos: [], offset: 0 }).segmentos

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx="90" cy="90" r={raio} fill="none" stroke="var(--bg-2)" strokeWidth="22" />
        
        {segmentos.map(({ categoria, i, tamanho, offset }) => (
          <circle
            key={categoria}
            cx="90"
            cy="90"
            r={raio}
            fill="none"
            stroke={CORES[i % CORES.length]}
            strokeWidth="22"
            strokeDasharray={`${animado ? tamanho : 0} ${circunferencia}`}
            strokeDashoffset={-offset}
            style={{ transition: `stroke-dasharray 900ms ease ${i * 90}ms` }}
          />
        ))}
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
        {entradas.map(([categoria, valor], i) => (
          <div key={categoria} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: CORES[i % CORES.length], flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--text-2)' }}>{categoria}</span>
            <span style={{ fontWeight: 600 }}>{((valor / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GraficoDespesas