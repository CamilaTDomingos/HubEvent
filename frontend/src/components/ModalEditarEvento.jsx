import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { TIPOS_EVENTO } from '../utils/categorias'
import Icone from './Icone'

const doisDigitos = (n) => String(n).padStart(2, '0')

// Data e horário (no fuso local) de um timestamp, no formato dos inputs.
function separarDataHora(valor) {
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return { data: '', hora: '' }
  const hora = `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
  return {
    data: `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`,
    hora: hora === '00:00' ? '' : hora,
  }
}

// Edita os detalhes de um evento já criado. Renderize só quando for abrir:
// os campos começam preenchidos com os valores do evento.
function ModalEditarEvento({ evento, aoFechar, aoSalvar }) {
  const inicial = separarDataHora(evento.data_inicio)

  const [nome, setNome] = useState(evento.nome ?? '')
  const [categoria, setCategoria] = useState(evento.categoria ?? '')
  const [data, setData] = useState(inicial.data)
  const [hora, setHora] = useState(inicial.hora)
  const [local, setLocal] = useState(evento.local ?? '')
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar(e) {
    e.preventDefault()
    setErro(null)

    if (!nome.trim() || !data) {
      setErro('Nome e data são obrigatórios.')
      return
    }

    const novoInicio = new Date(`${data}T${hora || '00:00'}:00`)
    // data_fim nunca fica antes do início. Se o evento era de um instante só
    // (início = fim, como na criação), o fim acompanha o novo início.
    const eraInstante = new Date(evento.data_fim).getTime() === new Date(evento.data_inicio).getTime()
    const fimAntigo = new Date(evento.data_fim)
    const novoFim = eraInstante || fimAntigo < novoInicio ? novoInicio : fimAntigo

    const dados = {
      nome: nome.trim(),
      categoria: categoria || null,
      local: local.trim() || null,
      data_inicio: novoInicio.toISOString(),
      data_fim: novoFim.toISOString(),
    }

    setSalvando(true)
    const { data: atualizado, error } = await supabase
      .from('evento')
      .update(dados)
      .eq('id', evento.id)
      .select()
      .single()
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }

    aoSalvar(atualizado)
    aoFechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="popup" onSubmit={handleSalvar} role="dialog" aria-modal="true" aria-labelledby="editar-evento-titulo">
        <h2 id="editar-evento-titulo" className="popup-title titulo">Editar <em>evento</em></h2>
        <p className="popup-sub">Mude o que precisar: nome, tipo, data, horário e local.</p>

        <div className="field">
          <label htmlFor="edit-ev-nome">Nome do evento</label>
          <input id="edit-ev-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>

        <fieldset className="field tipos">
          <legend className="label">Tipo de evento</legend>
          <div className="tipos-lista">
            {Object.entries(TIPOS_EVENTO).map(([nomeTipo, tipo]) => (
              <label key={nomeTipo} className={`tipo-chip ${categoria === nomeTipo ? 'sel' : ''}`}>
                <input
                  type="radio"
                  name="categoria-edicao"
                  value={nomeTipo}
                  checked={categoria === nomeTipo}
                  onChange={() => setCategoria(nomeTipo)}
                />
                <Icone nome={tipo.icone} tamanho={15} />
                {nomeTipo}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field-row">
          <div className="field">
            <label htmlFor="edit-ev-data">Data</label>
            <input id="edit-ev-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="edit-ev-hora">Horário</label>
            <input id="edit-ev-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="edit-ev-local">Local</label>
          <input
            id="edit-ev-local"
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
            {salvando ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ModalEditarEvento
