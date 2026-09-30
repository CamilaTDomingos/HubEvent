import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Icone from './Icone'

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
    { chave: 'convidados', label: 'Convidados', icone: 'usuarios', conta: totalConvidados },
    { chave: 'financeiro', label: 'Financeiro', icone: 'carteira', conta: totalDespesas },
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
          <Icone nome={a.icone} tamanho={16} />
          {a.label}
          <span className="aba-conta">{a.conta}</span>
        </button>
      ))}
      <Link to={`/eventos/${eventoId}/site`} className="aba aba-link">
        <Icone nome="globo" tamanho={16} />
        Site do evento
        <Icone nome="abrir" tamanho={13} className="aba-seta" />
      </Link>
      <span className="abas-indicador" ref={indicador} aria-hidden="true" />
    </div>
  )
}

export default AbasEvento
