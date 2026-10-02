import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Icone from './Icone'
import './Categorias.css'

function ModalTarefa({ aberto, eventoId, categorias, aoFechar, aoSalvar }) {
  const [titulo, setTitulo] = useState('')
  const [prazo, setPrazo] = useState('')
  const [categoriaId, setCategoriaId] = useState(null)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  if (!aberto) return null

  function fechar() {
    setTitulo('')
    setPrazo('')
    setCategoriaId(null)
    setErro(null)
    aoFechar()
  }

  async function handleSalvar(e) {
    e.preventDefault()
    if (!titulo.trim()) {
      setErro('Dê um nome para a tarefa.')
      return
    }

    setSalvando(true)
    const { error } = await supabase.from('tarefa').insert({
      evento_id: eventoId,
      titulo: titulo.trim(),
      prazo: prazo || null,
      // Só envia a coluna quando há categoria: assim criar tarefa sem
      // categoria continua funcionando mesmo antes da migração no banco.
      ...(categoriaId && { categoria_id: categoriaId }),
    })
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }

    aoSalvar()
    fechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <form className="popup popup-sm" onSubmit={handleSalvar} role="dialog" aria-modal="true" aria-labelledby="nova-tarefa-titulo">
        <h2 id="nova-tarefa-titulo" className="popup-title titulo">Nova <em>tarefa</em></h2>
        <p className="popup-sub">O que precisa estar pronto até o grande dia?</p>

        <div className="field">
          <label htmlFor="tarefa-titulo">Tarefa</label>
          <input id="tarefa-titulo" type="text" placeholder="Ex.: Fechar o buffet" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="tarefa-prazo">Prazo <span className="muted">(opcional)</span></label>
          <input id="tarefa-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>

        <fieldset className="field cat-campo">
          <legend className="label">Categoria <span className="muted">(opcional)</span></legend>
          {categorias.length === 0 ? (
            <p className="muted modal-cat-vazio">
              Você ainda não tem categorias. <Link to="/perfil" className="link">Criar no perfil <Icone nome="seta" tamanho={13} /></Link>
            </p>
          ) : (
            <div className="modal-cat-lista" role="radiogroup">
              <button type="button" role="radio" aria-checked={!categoriaId} className="modal-cat" onClick={() => setCategoriaId(null)}>
                Sem categoria
              </button>
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={categoriaId === c.id}
                  className="modal-cat"
                  style={{ '--cat': c.cor }}
                  onClick={() => setCategoriaId(c.id)}
                >
                  <span className="modal-cat-ponto" />
                  {c.nome}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        {erro && <p className="erro-msg">{erro}</p>}

        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={fechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar tarefa'}</button>
        </div>
      </form>
    </div>
  )
}

export default ModalTarefa
