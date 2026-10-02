import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { TIPOS_EVENTO } from '../utils/categorias'
import { MODULOS_OBRIGATORIOS, MODULOS_OPCIONAIS, salvarModulos } from '../utils/modulos'
import Icone from './Icone'

function ModalCriarEvento({ aberto, aoFechar, aoCriar }) {
  const { usuario } = useAuth()

  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('Casamento')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [local, setLocal] = useState('')
  const [opcionais, setOpcionais] = useState({ presentes: false, site: false })
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

    const { data: criado, error } = await supabase.from('evento').insert({
      organizador_id: usuario.id,
      nome,
      categoria,
      local,
      data_inicio: dataInicio,
      data_fim: dataInicio,
    }).select('id').single()

    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }

    salvarModulos(criado.id, opcionais)

    setNome('')
    setLocal('')
    setData('')
    setHora('')
    setOpcionais({ presentes: false, site: false })
    aoCriar()
    aoFechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="popup" onSubmit={handleCriar} role="dialog" aria-modal="true" aria-labelledby="novo-evento-titulo">
        <h2 id="novo-evento-titulo" className="popup-title titulo">Novo <em>evento</em></h2>
        <p className="popup-sub">Comece pelo essencial — o resto você completa depois.</p>

        <div className="field">
          <label htmlFor="novo-ev-nome">Nome do evento</label>
          <input
            id="novo-ev-nome"
            type="text"
            placeholder="Ex: Casamento Ana & Bruno"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />
        </div>

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
                <Icone nome={tipo.icone} tamanho={15} />
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

        <fieldset className="field modulos">
          <legend className="label">Módulos do evento</legend>
          <ul className="modulos-fixos" aria-label="Sempre incluídos">
            {MODULOS_OBRIGATORIOS.map((m) => (
              <li key={m.chave} title={m.descricao}>
                <Icone nome={m.icone} tamanho={15} />
                {m.nome}
                <Icone nome="check" tamanho={13} className="modulo-check" />
              </li>
            ))}
          </ul>
          <p className="modulos-nota">Sempre incluídos. Ative também, se quiser:</p>
          <div className="modulos-opcionais">
            {MODULOS_OPCIONAIS.map((m) => (
              <label key={m.chave} className={`modulo ${opcionais[m.chave] ? 'sel' : ''}`}>
                <span className="modulo-icone"><Icone nome={m.icone} tamanho={17} /></span>
                <span className="modulo-texto">
                  <strong>{m.nome}</strong>
                  <span>{m.descricao}</span>
                </span>
                <span className="switch">
                  <input
                    type="checkbox"
                    checked={opcionais[m.chave]}
                    onChange={(e) => setOpcionais((atual) => ({ ...atual, [m.chave]: e.target.checked }))}
                  />
                  <span className="switch-track" />
                </span>
              </label>
            ))}
          </div>
          {opcionais.presentes && !opcionais.site && (
            <p className="modulos-aviso">Os convidados escolhem os presentes pelo site. Sem ele, a lista fica visível só para você.</p>
          )}
        </fieldset>

        {erro && <p className="erro-msg">{erro}</p>}

        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Criando…' : 'Criar evento'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ModalCriarEvento
