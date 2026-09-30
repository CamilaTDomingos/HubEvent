import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Abas com um indicador que desliza até a aba ativa.
function AbasEvento({ aba, aoTrocar, eventoId, totalConvidados, totalDespesas }) {
  const trilho = useRef(null)
  const indicador = useRef(null)

  useLayoutEffect(() => {
    function posicionar() {
      const ativo = trilho.current?.querySelector('[aria-selected="true"]')
      if (!ativo || !indicador.current) return
      indicador.current.style.width = `${ativo.offsetWidth}px`
      indicador.current.style.transform = `translateX(${ativo.offsetLeft}px)`
    }
    posicionar()
    window.addEventListener('resize', posicionar)
    return () => window.removeEventListener('resize', posicionar)
  }, [aba, totalConvidados, totalDespesas])

  const abas = [
    { chave: 'convidados', label: 'Convidados', conta: totalConvidados },
    { chave: 'financeiro', label: 'Financeiro', conta: totalDespesas },
  ]

  return (
    <div className="abas" ref={trilho} role="tablist">
      {abas.map((a) => (
        <button
          key={a.chave}
          role="tab"
          aria-selected={aba === a.chave}
          className="aba"
          onClick={() => aoTrocar(a.chave)}
        >
          {a.label}
          <sup>{a.conta}</sup>
        </button>
      ))}
      <Link to={`/eventos/${eventoId}/site`} className="aba aba-link">
        Site do evento <span aria-hidden="true">↗</span>
      </Link>
      <span className="abas-indicador" ref={indicador} aria-hidden="true" />
    </div>
  )
}

export default AbasEvento
