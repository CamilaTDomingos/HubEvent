import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function ModalTarefa({ aberto, eventoId, aoFechar, aoSalvar }) {
  const [titulo, setTitulo] = useState('')
  const [prazo, setPrazo] = useState('')
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  if (!aberto) return null

  function fechar() {
    setTitulo('')
    setPrazo('')
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
