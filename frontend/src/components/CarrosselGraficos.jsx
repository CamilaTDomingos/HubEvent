import { useEffect, useRef, useState } from 'react'
import Icone from './Icone'
import './CarrosselGraficos.css'

// Largura mínima do espaço para os gráficos ficarem lado a lado. Abaixo disso
// viram um carrossel (setas e bolinhas; toque/trackpad rolam via scroll-snap).
// Mantenha igual ao @container de CarrosselGraficos.css.
const LARGURA_LADO_A_LADO = 900

// `slides`: [{ chave, rotulo, conteudo }]
function CarrosselGraficos({ slides }) {
  const faixa = useRef(null)
  const raiz = useRef(null)
  const [atual, setAtual] = useState(0)
  const [ladoALado, setLadoALado] = useState(false)

  useEffect(() => {
    const el = raiz.current
    if (!el) return undefined
    const observador = new ResizeObserver(([e]) => setLadoALado(e.contentRect.width >= LARGURA_LADO_A_LADO))
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  function irPara(i) {
    const el = faixa.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  function aoRolar(e) {
    const el = e.currentTarget
    setAtual(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="carrossel" ref={raiz}>
      <div className="carrossel-faixa" ref={faixa} onScroll={aoRolar}>
        {slides.map((s, i) => (
          <div
            key={s.chave}
            className="carrossel-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${slides.length}: ${s.rotulo}`}
            inert={!ladoALado && i !== atual}
          >
            {s.conteudo}
          </div>
        ))}
      </div>

      {!ladoALado && (
      <div className="carrossel-nav">
        <button type="button" className="carrossel-seta" onClick={() => irPara(atual - 1)} disabled={atual === 0} aria-label="Gráfico anterior">
          <Icone nome="chevron" tamanho={16} />
        </button>
        <div className="carrossel-bolinhas" role="tablist" aria-label="Escolher gráfico">
          {slides.map((s, i) => (
            <button
              key={s.chave}
              type="button"
              role="tab"
              aria-selected={i === atual}
              aria-label={s.rotulo}
              title={s.rotulo}
              className={i === atual ? 'sel' : ''}
              onClick={() => irPara(i)}
            />
          ))}
        </div>
        <button type="button" className="carrossel-seta prox" onClick={() => irPara(atual + 1)} disabled={atual === slides.length - 1} aria-label="Próximo gráfico">
          <Icone nome="chevron" tamanho={16} />
        </button>
      </div>
      )}
    </div>
  )
}

export default CarrosselGraficos
