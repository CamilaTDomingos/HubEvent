import { useId } from 'react'

// Selo circular com texto girando: o atalho mais visível para criar um evento.
function SeloNovoEvento({ onClick, className = '' }) {
  const idCirculo = `selo-${useId()}`

  return (
    <button type="button" className={`selo ${className}`} onClick={onClick} aria-label="Criar novo evento">
      <svg viewBox="0 0 120 120" className="selo-texto" aria-hidden="true">
        <defs>
          <path id={idCirculo} d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
        </defs>
        <text>
          <textPath href={`#${idCirculo}`} textLength="282" lengthAdjust="spacing">
            novo evento ✦ novo evento ✦
          </textPath>
        </text>
      </svg>
      <span className="selo-mais" aria-hidden="true">+</span>
    </button>
  )
}

export default SeloNovoEvento
