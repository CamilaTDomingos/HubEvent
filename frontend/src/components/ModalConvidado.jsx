import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MAX_ACOMPANHANTES, acompanhantesConfirmados } from '../utils/convidados'

// Cadastra um convidado ou, quando recebe `convidado`, edita o existente.
// Só é montado com o modal aberto, então o estado parte do convidado certo.
function ModalConvidado({ convidado, eventoId, grupos, aoFechar, aoSalvar }) {
  const editando = !!convidado
  const [nome, setNome] = useState(convidado?.nome ?? '')
  const [email, setEmail] = useState(convidado?.email ?? '')
  const [grupoId, setGrupoId] = useState(convidado?.grupo_id ?? '')
  const [permitidos, setPermitidos] = useState(String(convidado?.acompanhantes_permitidos ?? 0))
  const [enviado, setEnviado] = useState(!!convidado?.enviado_em)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const respondeu = editando && convidado.status_presenca !== 'PENDENTE'
  const confirmados = editando ? acompanhantesConfirmados(convidado) : 0
  const limite = Number(permitidos)
  const vaiReduzir = Number.isInteger(limite) && limite < confirmados

  async function handleSalvar(e) {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Dê o nome do convidado.')
      return
    }
    if (!Number.isInteger(limite) || limite < 0 || limite > MAX_ACOMPANHANTES) {
      setErro(`Acompanhantes: um número de 0 a ${MAX_ACOMPANHANTES}.`)
      return
    }

    const dados = {
      nome: nome.trim(),
      email: email.trim() || null,
      grupo_id: grupoId || null,
      acompanhantes_permitidos: limite,
      // Quem já levava mais gente do que o novo limite fica no limite.
      ...(vaiReduzir && { acompanhantes_confirmados: limite }),
      ...(editando && !respondeu && enviado !== !!convidado.enviado_em && {
        enviado_em: enviado ? new Date().toISOString() : null,
      }),
    }

    setSalvando(true)
    const { error } = editando
      ? await supabase.from('convidado').update(dados).eq('id', convidado.id)
      : await supabase.from('convidado').insert({ ...dados, evento_id: eventoId })
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
      <form className="popup popup-sm" onSubmit={handleSalvar} role="dialog" aria-modal="true" aria-labelledby="convidado-titulo">
        <h2 id="convidado-titulo" className="popup-title titulo">{editando ? <>Editar <em>convidado</em></> : <>Novo <em>convidado</em></>}</h2>
        <p className="popup-sub">{editando ? 'Ajuste os dados do convite.' : 'Cada convidado recebe um link próprio para confirmar presença.'}</p>

        <div className="field">
          <label htmlFor="conv-nome">Nome</label>
          <input id="conv-nome" type="text" placeholder="Nome do convidado" maxLength={255} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="conv-email">E-mail <span className="muted">(opcional)</span></label>
          <input id="conv-email" type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="conv-campos">
          <div className="field">
            <label htmlFor="conv-grupo">Grupo</label>
            <select id="conv-grupo" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
              <option value="">Sem grupo</option>
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="conv-acomp">Acompanhantes</label>
            <input id="conv-acomp" type="number" min="0" max={MAX_ACOMPANHANTES} step="1" inputMode="numeric" value={permitidos} onChange={(e) => setPermitidos(e.target.value)} />
          </div>
        </div>
        <p className="conv-dica">
          {vaiReduzir
            ? `${convidado.nome} confirmou com ${confirmados}; ao salvar, fica com ${limite}.`
            : limite > 0
              ? `O convidado poderá levar até ${limite} ${limite === 1 ? 'pessoa' : 'pessoas'}.`
              : 'Convite individual, sem acompanhantes.'}
        </p>

        {editando && (
          <label className="switch conv-enviado">
            <input type="checkbox" checked={respondeu || enviado} disabled={respondeu} onChange={(e) => setEnviado(e.target.checked)} />
            <span className="switch-track" />
            <span className="switch-texto">{respondeu ? 'Convite recebido (já respondeu)' : 'Convite já enviado'}</span>
          </label>
        )}

        {erro && <p className="erro-msg">{erro}</p>}

        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ModalConvidado
