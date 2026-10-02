import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Icone from './Icone'
import './Categorias.css'

// Cria uma tarefa nova ou, quando recebe `tarefa`, edita a existente.
// O componente só é montado enquanto o modal está aberto, então o estado
// inicial sempre parte da tarefa certa.
function ModalTarefa({ tarefa, eventoId, categorias, aoFechar, aoSalvar }) {
  const editando = !!tarefa
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? '')
  const [prazo, setPrazo] = useState(tarefa?.prazo ?? '')
  const [categoriaId, setCategoriaId] = useState(tarefa?.categoria_id ?? null)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar(e) {
    e.preventDefault()
    if (!titulo.trim()) {
      setErro('Dê um nome para a tarefa.')
      return
    }

    const dados = {
      titulo: titulo.trim(),
      prazo: prazo || null,
      // Só envia a coluna quando há categoria (ou quando a tarefa já veio
      // com ela): assim salvar continua funcionando antes da migração.
      ...((categoriaId || (editando && 'categoria_id' in tarefa)) && { categoria_id: categoriaId }),
    }

    setSalvando(true)
    const { error } = editando
      ? await supabase.from('tarefa').update(dados).eq('id', tarefa.id)
      : await supabase.from('tarefa').insert({ ...dados, evento_id: eventoId })
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }

    aoSalvar()
    aoFechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="popup popup-sm" onSubmit={handleSalvar} role="dialog" aria-modal="true" aria-labelledby="nova-tarefa-titulo">
        <h2 id="nova-tarefa-titulo" className="popup-title titulo">{editando ? <>Editar <em>tarefa</em></> : <>Nova <em>tarefa</em></>}</h2>
        <p className="popup-sub">{editando ? 'Ajuste o que mudou nesta tarefa.' : 'O que precisa estar pronto até o grande dia?'}</p>

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
          <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar tarefa'}</button>
        </div>
      </form>
    </div>
  )
}

export default ModalTarefa
