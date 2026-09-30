import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ModalConfirmacao from './ModalConfirmacao'
import NumeroAnimado from './NumeroAnimado'
import { iniciais, tomAvatar } from '../utils/categorias'

const STATUS = {
  CONFIRMADO: { label: 'Confirmado', plural: 'confirmados' },
  PENDENTE: { label: 'Pendente', plural: 'pendentes' },
  RECUSADO: { label: 'Recusou', plural: 'recusaram' },
}

function AbaConvidados({ eventoId, convidados, carregando, recarregar }) {
  const [nomeConvidado, setNomeConvidado] = useState('')
  const [emailConvidado, setEmailConvidado] = useState('')
  const [filtro, setFiltro] = useState(null)
  const [copiado, setCopiado] = useState(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)

  const contagem = {
    CONFIRMADO: convidados.filter((c) => c.status_presenca === 'CONFIRMADO').length,
    PENDENTE: convidados.filter((c) => c.status_presenca === 'PENDENTE').length,
    RECUSADO: convidados.filter((c) => c.status_presenca === 'RECUSADO').length,
  }
  const total = convidados.length
  const lista = filtro ? convidados.filter((c) => c.status_presenca === filtro) : convidados

  async function handleAdicionarConvidado(e) {
    e.preventDefault()
    if (!nomeConvidado) return

    const { error } = await supabase.from('convidado').insert({
      evento_id: eventoId,
      nome: nomeConvidado,
      email: emailConvidado || null,
    })

    if (!error) {
      setNomeConvidado('')
      setEmailConvidado('')
      recarregar()
    }
  }

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return
    const { error } = await supabase.from('convidado').delete().eq('id', confirmandoExclusao)
    if (!error) recarregar()
    setConfirmandoExclusao(null)
  }

  async function copiarLink(convidadoId) {
    const url = `${window.location.origin}/rsvp/${convidadoId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(convidadoId)
      setTimeout(() => setCopiado((atual) => (atual === convidadoId ? null : atual)), 1800)
    } catch {
      window.prompt('Copie o link do convite:', url)
    }
  }

  return (
    <div className="conv">
      <aside className="conv-lateral">
        <div className="conv-resumo">
          <span className="conv-grande display">
            <NumeroAnimado valor={contagem.CONFIRMADO} casas={0} />
          </span>
          <p className="conv-de">
            de <strong>{total}</strong> {total === 1 ? 'convidado confirmou' : 'convidados confirmaram'}
          </p>
        </div>

        <div className="barra-rsvp" aria-hidden="true">
          {total === 0 ? (
            <span className="barra-seg vazio" style={{ flexGrow: 1 }} />
          ) : (
            Object.keys(STATUS).map((s) =>
              contagem[s] > 0 ? (
                <span
                  key={s}
                  className={`barra-seg seg-${s.toLowerCase()} ${filtro && filtro !== s ? 'apagado' : ''}`}
                  style={{ flexGrow: contagem[s] }}
                />
              ) : null
            )
          )}
        </div>

        <div className="legenda-rsvp" role="group" aria-label="Filtrar por status">
          {Object.entries(STATUS).map(([s, info]) => (
            <button
              key={s}
              className={`legenda-item st-${s.toLowerCase()} ${filtro === s ? 'sel' : ''}`}
              aria-pressed={filtro === s}
              onClick={() => setFiltro(filtro === s ? null : s)}
            >
              <span className="ponto" />
              <strong className="num">{contagem[s]}</strong> {info.plural}
            </button>
          ))}
        </div>

        <form className="convidar" onSubmit={handleAdicionarConvidado}>
          <p className="eyebrow">Convidar alguém</p>
          <input
            className="input"
            type="text"
            placeholder="Nome do convidado"
            aria-label="Nome do convidado"
            value={nomeConvidado}
            onChange={(e) => setNomeConvidado(e.target.value)}
            required
          />
          <input
            className="input"
            type="email"
            placeholder="E-mail (opcional)"
            aria-label="E-mail do convidado"
            value={emailConvidado}
            onChange={(e) => setEmailConvidado(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-block">+ Adicionar à lista</button>
        </form>
      </aside>

      <section className="conv-principal">
        <div className="lista-topo">
          <h3>{filtro ? `Só ${STATUS[filtro].plural}` : 'A lista'}</h3>
          {filtro && (
            <button className="link mono" onClick={() => setFiltro(null)}>mostrar todos ✕</button>
          )}
        </div>

        {carregando ? (
          <p className="muted">Carregando…</p>
        ) : lista.length === 0 ? (
          <p className="lista-vazia display">
            {total === 0 ? <>Ninguém na lista <em>ainda.</em></> : <>Ninguém <em>por aqui.</em></>}
          </p>
        ) : (
          <ul className="conv-lista">
            {lista.map((c, i) => (
              <li key={c.id} className="conv-linha" style={{ '--i': i }}>
                <span className="avatar" style={{ background: tomAvatar(c.nome) }} aria-hidden="true">
                  {iniciais(c.nome)}
                </span>
                <div className="conv-nome">
                  <strong>{c.nome}</strong>
                  <span className="mono muted">{c.email || 'sem e-mail'}</span>
                </div>
                <span className={`status st-${c.status_presenca.toLowerCase()}`}>
                  <span className="ponto" />
                  {STATUS[c.status_presenca]?.label}
                </span>
                <div className="conv-acoes">
                  <button className={`link mono ${copiado === c.id ? 'copiado' : ''}`} onClick={() => copiarLink(c.id)}>
                    {copiado === c.id ? 'copiado ✓' : 'copiar convite'}
                  </button>
                  <a className="link mono" href={`/rsvp/${c.id}`} target="_blank" rel="noreferrer">
                    abrir ↗
                  </a>
                  <button className="link mono link-danger" onClick={() => setConfirmandoExclusao(c.id)}>
                    remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalConfirmacao
        aberto={!!confirmandoExclusao}
        titulo="Remover convidado?"
        mensagem="Tem certeza que deseja remover esse convidado? Essa ação não pode ser desfeita."
        textoConfirmar="Remover"
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setConfirmandoExclusao(null)}
      />
    </div>
  )
}

export default AbaConvidados
