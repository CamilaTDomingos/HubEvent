import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

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

  async function handleCriar() {
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
    <div className="overlay open">
      <div className="popup">
        <div className="popup-title">Criar novo evento</div>
        <p className="popup-sub">Preencha as informações principais do evento.</p>

        <div className="field">
          <label>Nome do evento</label>
          <input
            type="text"
            placeholder="Ex: Casamento Ana & Bruno"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Tipo de evento</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option>Casamento</option>
            <option>Chá de bebê</option>
            <option>Chá de panela</option>
            <option>Aniversário</option>
            <option>Formatura</option>
            <option>Corporativo</option>
            <option>Outro</option>
          </select>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="field">
            <label>Horário</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Local</label>
          <input
            type="text"
            placeholder="Buffet, espaço, endereço..."
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
        </div>

        {erro && <p style={{ color: 'var(--red)', fontSize: '13px' }}>{erro}</p>}

        <div className="popup-actions">
          <button className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCriar} disabled={salvando}>
            {salvando ? 'Criando...' : 'Criar evento →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalCriarEvento