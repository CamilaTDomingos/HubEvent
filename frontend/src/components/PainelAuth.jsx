import { useRef } from 'react'
import Forma from './Forma'

// Formas espalhadas com "profundidades" diferentes: acompanham o mouse
// em velocidades distintas e criam uma leve sensação de paralaxe.
const FORMAS = [
  { tipo: 'flor', cor: 'var(--lilac)', tamanho: 190, top: '8%', left: '62%', prof: 22 },
  { tipo: 'estrela', cor: 'var(--sun)', tamanho: 120, top: '60%', left: '72%', prof: -30 },
  { tipo: 'arco', cor: 'var(--tomato)', tamanho: 96, top: '78%', left: '8%', prof: 16 },
  { tipo: 'circulo', cor: 'var(--sky)', tamanho: 54, top: '16%', left: '12%', prof: -18 },
  { tipo: 'blob', cor: 'var(--mint)', tamanho: 70, top: '44%', left: '88%', prof: 34 },
]

function PainelAuth({ titulo, texto }) {
  const painel = useRef(null)

  function acompanharMouse(e) {
    const r = painel.current.getBoundingClientRect()
    painel.current.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    painel.current.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }

  return (
    <aside className="auth-painel" ref={painel} onMouseMove={acompanharMouse}>
      {FORMAS.map((f, i) => (
        <div
          key={i}
          className="auth-forma"
          style={{ top: f.top, left: f.left, '--prof': f.prof, '--d': i }}
        >
          <Forma tipo={f.tipo} cor={f.cor} tamanho={f.tamanho} />
        </div>
      ))}

      <div className="auth-marca">
        <Forma tipo="flor" cor="var(--tomato)" tamanho={26} />
        HubEvent
      </div>

      <div className="auth-manchete">
        <h1 className="display">{titulo}</h1>
        <p>{texto}</p>
      </div>

      <p className="auth-rodape mono">convidados · presentes · checklist · orçamento</p>
    </aside>
  )
}

export default PainelAuth
