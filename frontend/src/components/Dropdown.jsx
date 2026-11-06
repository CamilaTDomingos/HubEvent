import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import './Dropdown.css'

// Seleção em lista no estilo das categorias: gatilho e opções em pílula.
// `opcoes`: [{ valor, rotulo, cor? }]. Com `cor`, a opção ganha uma bolinha e tinge a seleção.
function Dropdown({ id, valor, opcoes, aoMudar, placeholder = 'Selecione', rotulo, className = '', autoFocus = false }) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef(null)
  const menu = useRef(null)
  const [pos, setPos] = useState(null)
  const selecionada = opcoes.find((o) => o.valor === valor)

  useEffect(() => {
    if (!aberto) return undefined
    const fora = (e) => {
      if (raiz.current?.contains(e.target) || menu.current?.contains(e.target)) return
      setAberto(false)
    }
    const esc = (e) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  // A lista vai para o <body> com posição fixa: assim nenhum cartão, modal,
  // animação ou rolagem fica por cima dela, e ela não ocupa espaço no layout.

  useLayoutEffect(() => {
    if (!aberto) return undefined
    const FOLGA = 6 // distância do gatilho
    const MARGEM = 12 // distância da borda da janela
    const medir = () => {
      const r = raiz.current.getBoundingClientRect()
      // scrollHeight: altura completa da lista, mesmo com max-height aplicado.
      const altura = menu.current?.scrollHeight ?? 0
      const abaixo = window.innerHeight - r.bottom - FOLGA - MARGEM
      const acima = r.top - FOLGA - MARGEM
      // Abre para cima só quando não cabe embaixo e há mais espaço em cima.
      const paraCima = altura > abaixo && acima > abaixo
      const espaco = paraCima ? acima : abaixo
      const alturaFinal = Math.min(altura || espaco, espaco)
      setPos({
        top: paraCima ? r.top - FOLGA - alturaFinal : r.bottom + FOLGA,
        left: r.left,
        width: r.width,
        maxHeight: Math.max(espaco, 96),
      })
    }
    medir()
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [aberto])

  function escolher(v) {
    aoMudar(v)
    setAberto(false)
  }

  const lista = (
    <div
      ref={menu}
      className="dropdown-menu"
      role="listbox"
      aria-label={rotulo}
      // Antes da primeira medição a lista fica invisível, só para ter altura.
      style={pos ? { top: pos.top, left: pos.left, minWidth: pos.width, maxHeight: Math.min(pos.maxHeight, 260) } : { top: 0, left: 0, visibility: 'hidden' }}
    >
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="option"
          aria-selected={o.valor === valor}
          className="modal-cat"
          style={o.cor ? { '--cat': o.cor } : undefined}
          onClick={() => escolher(o.valor)}
        >
          {o.cor && <span className="modal-cat-ponto" />}
          {o.rotulo}
        </button>
      ))}
    </div>
  )

  return (
    <div className={`dropdown ${className}`} ref={raiz}>
      <button
        id={id}
        type="button"
        className="modal-cat dropdown-btn"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={rotulo}
        autoFocus={autoFocus}
        style={selecionada?.cor ? { '--cat': selecionada.cor } : undefined}
        onClick={() => setAberto((v) => !v)}
      >
        {selecionada?.cor && <span className="modal-cat-ponto" />}
        <span className="dropdown-texto">{selecionada ? selecionada.rotulo : placeholder}</span>
        <span className="dropdown-seta" aria-hidden="true">▾</span>
      </button>
      {aberto && createPortal(lista, document.body)}
    </div>
  )
}

export default Dropdown
