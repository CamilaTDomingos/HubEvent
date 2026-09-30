import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { TIPOS_EVENTO } from '../utils/categorias'
import Forma from './Forma'

function ModalCriarEvento({ aberto, aoFechar, aoCriar }) {
  const { usuario } = useAuth()

  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('Casamento')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [local, setLocal] = useState('')
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  if (!aberto) return null

  async function handleCriar(e) {
    e.preventDefault()
    setErro(null)

    if (!nome || !data) {
      setErro('Nome e data são obrigatórios.')
      return
    }

    setSalvando(true)

    const dataInicio = hora ? `${data}T${hora}:00` : `${data}T00:00:00`

    const { error } = await supabase.from('evento').insert({
      organizador_id: usuario.id,
      nome,
      categoria,
      local,
      data_inicio: dataInicio,
      data_fim: dataInicio,
    })

    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    setLocal('')
    setData('')
    setHora('')
    aoCriar()
    aoFechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="popup" onSubmit={handleCriar} role="dialog" aria-modal="true" aria-labelledby="novo-evento-titulo">
        <p className="eyebrow">Novo evento</p>
        <h2 id="novo-evento-titulo" className="sr-only">Criar novo evento</h2>

        <input
          className="novo-ev-nome"
          type="text"
          placeholder="Como vai se chamar?"
          aria-label="Nome do evento"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
        />

        <fieldset className="field tipos">
          <legend className="label">Tipo de evento</legend>
          <div className="tipos-lista">
            {Object.entries(TIPOS_EVENTO).map(([nomeTipo, tipo]) => (
              <label key={nomeTipo} className={`tipo-chip ${categoria === nomeTipo ? 'sel' : ''}`}>
                <input
                  type="radio"
                  name="categoria"
                  value={nomeTipo}
                  checked={categoria === nomeTipo}
                  onChange={() => setCategoria(nomeTipo)}
                />
                <Forma tipo={tipo.forma} cor={tipo.cor} tamanho={16} contorno />
                {nomeTipo}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field-row">
          <div className="field">
            <label htmlFor="novo-ev-data">Data</label>
            <input id="novo-ev-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="novo-ev-hora">Horário</label>
            <input id="novo-ev-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="novo-ev-local">Local</label>
          <input
            id="novo-ev-local"
            type="text"
            placeholder="Buffet, espaço, endereço…"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
        </div>

        {erro && <p className="erro-msg">{erro}</p>}

        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Criando…' : 'Criar evento →'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ModalCriarEvento
