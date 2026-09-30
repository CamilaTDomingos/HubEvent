const CORES = ['var(--tomato)', 'var(--sun)', 'var(--lilac)', 'var(--mint)', 'var(--sky)']

// Sorteia os pedaços fora do render (no clique), mantendo o componente puro.
// eslint-disable-next-line react-refresh/only-export-components
export function sortearConfete(quantidade = 60) {
  return Array.from({ length: quantidade }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 900,
    y: -(Math.random() * 380 + 160),
    giro: Math.random() * 900 - 450,
    atraso: Math.random() * 0.15,
    cor: CORES[i % CORES.length],
    largura: 6 + Math.random() * 8,
    redondo: Math.random() > 0.6,
  }))
}

// Explosão única de confete: só aparece no momento em que o convidado confirma.
function Confete({ pedacos }) {
  return (
    <div className="confete" aria-hidden="true">
      {pedacos.map((p) => (
        <span
          key={p.id}
          style={{
            '--x': `${p.x}px`,
            '--y': `${p.y}px`,
            '--giro': `${p.giro}deg`,
            animationDelay: `${p.atraso}s`,
            background: p.cor,
            width: p.largura,
            height: p.redondo ? p.largura : p.largura * 0.45,
            borderRadius: p.redondo ? '50%' : 2,
          }}
        />
      ))}
    </div>
  )
}

export default Confete
