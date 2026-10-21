// Cores da paleta do site: petróleo, petróleo escuro, tom claro de petróleo e os acentos.
const CORES = ['#1e6b7b', '#164f5c', '#7fb3be', '#e8a432', '#3b6fe8']

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
