// Formas orgânicas geradas por função polar: r(θ) define o contorno.
function contornoPolar(raio, pontos = 96) {
  let d = ''
  for (let i = 0; i <= pontos; i++) {
    const t = (i / pontos) * Math.PI * 2
    const r = raio(t)
    const x = 50 + r * Math.cos(t)
    const y = 50 + r * Math.sin(t)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return d + 'Z'
}

const CAMINHOS = {
  flor: contornoPolar((t) => 40 + 8 * Math.cos(8 * t)),
  estrela: contornoPolar((t) => 38 + 10 * Math.sign(Math.cos(12 * t)) * Math.pow(Math.abs(Math.cos(12 * t)), 0.6), 240),
  blob: contornoPolar((t) => 42 + 5 * Math.sin(3 * t) + 3 * Math.cos(5 * t + 1)),
  circulo: 'M50 6a44 44 0 1 1 0 88a44 44 0 1 1 0-88Z',
  arco: 'M8 94V52a42 42 0 0 1 84 0v42Z',
  quadrado: 'M22 8h56a14 14 0 0 1 14 14v56a14 14 0 0 1-14 14H22A14 14 0 0 1 8 78V22A14 14 0 0 1 22 8Z',
}

function Forma({ tipo = 'blob', cor = 'var(--ink)', tamanho = 40, contorno = false, className = '', style }) {
  return (
    <svg
      className={`forma ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 100 100"
      style={{ flexShrink: 0, overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      <path
        d={CAMINHOS[tipo] || CAMINHOS.blob}
        fill={cor}
        stroke={contorno ? 'var(--ink)' : 'none'}
        strokeWidth={contorno ? 1.5 : 0}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Forma
