import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ModalConfirmacao from './ModalConfirmacao'
import NumeroAnimado from './NumeroAnimado'
import Icone from './Icone'
import { iniciais } from '../utils/categorias'

const STATUS = {
  CONFIRMADO: { label: 'Confirmado', plural: 'Confirmados', badge: 'badge-ok' },
  PENDENTE: { label: 'Pendente', plural: 'Pendentes', badge: 'badge-pend' },
  RECUSADO: { label: 'Recusou', plural: 'Recusaram', badge: 'badge-no' },
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
  const percentual = total ? Math.round((contagem.CONFIRMADO / total) * 100) : 0
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
        <section className="painel rsvp-resumo">
          <p className="eyebrow">Confirmações</p>
          <div className="rsvp-numero">
            <strong className="titulo num"><NumeroAnimado valor={contagem.CONFIRMADO} casas={0} /></strong>
            <span className="rsvp-de">de {total} {total === 1 ? 'convidado' : 'convidados'}</span>
            <span className="rsvp-pct">{percentual}%</span>
          </div>

          <div className="barra-rsvp" aria-hidden="true">
            {Object.keys(STATUS).map((s) =>
              contagem[s] > 0 ? (
                <span
                  key={s}
                  className={`barra-seg seg-${s.toLowerCase()} ${filtro && filtro !== s ? 'apagado' : ''}`}
                  style={{ flexGrow: contagem[s] }}
                />
              ) : null
            )}
          </div>

          <div className="filtro-status" role="group" aria-label="Filtrar por status">
            {Object.entries(STATUS).map(([s, info]) => (
              <button
                key={s}
                className={`filtro-item st-${s.toLowerCase()} ${filtro === s ? 'sel' : ''}`}
                aria-pressed={filtro === s}
                onClick={() => setFiltro(filtro === s ? null : s)}
              >
                <span className="ponto" />
                {info.plural}
                <strong className="num">{contagem[s]}</strong>
              </button>
            ))}
          </div>
        </section>

        <form className="convidar" onSubmit={handleAdicionarConvidado}>
          <h3 className="titulo">Adicionar convidado</h3>
          <div className="field">
            <label htmlFor="conv-nome">Nome</label>
            <input id="conv-nome" type="text" placeholder="Nome do convidado" value={nomeConvidado} onChange={(e) => setNomeConvidado(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="conv-email">E-mail <span className="muted">(opcional)</span></label>
            <input id="conv-email" type="email" placeholder="email@exemplo.com" value={emailConvidado} onChange={(e) => setEmailConvidado(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block"><Icone nome="mais" tamanho={16} /> Adicionar</button>
        </form>
      </aside>

      <section className="painel conv-principal">
        <div className="painel-cab">
          <h3 className="titulo">{filtro ? STATUS[filtro].plural : 'Lista de convidados'}</h3>
          {filtro ? (
            <button className="link" onClick={() => setFiltro(null)}>Mostrar todos</button>
          ) : (
            <span className="muted">{total} {total === 1 ? 'pessoa' : 'pessoas'}</span>
          )}
        </div>

        {carregando ? (
          <p className="muted painel-vazio">Carregando…</p>
        ) : lista.length === 0 ? (
          <div className="painel-vazio">
            <Icone nome="usuarios" tamanho={26} />
            <p>{total === 0 ? 'Ninguém na lista ainda. Adicione o primeiro convidado ao lado.' : 'Ninguém com esse status.'}</p>
          </div>
        ) : (
          <ul className="conv-lista">
            {lista.map((c, i) => (
              <li key={c.id} className="conv-linha" style={{ '--i': i }}>
                <span className="avatar" aria-hidden="true">{iniciais(c.nome)}</span>
                <div className="conv-nome">
                  <strong>{c.nome}</strong>
                  <span>{c.email || 'Sem e-mail'}</span>
                </div>
                <span className={`badge ${STATUS[c.status_presenca]?.badge}`}>{STATUS[c.status_presenca]?.label}</span>
                <div className="conv-acoes">
                  {copiado === c.id ? (
                    <span className="copiado"><Icone nome="check" tamanho={15} /> Link copiado</span>
                  ) : (
                    <button className="btn-icone" onClick={() => copiarLink(c.id)} title="Copiar link do convite" aria-label={`Copiar link do convite de ${c.nome}`}>
                      <Icone nome="copiar" tamanho={16} />
                    </button>
                  )}
                  <a className="btn-icone" href={`/rsvp/${c.id}`} target="_blank" rel="noreferrer" title="Abrir convite" aria-label={`Abrir convite de ${c.nome}`}>
                    <Icone nome="abrir" tamanho={16} />
                  </a>
                  <button className="btn-icone perigo" onClick={() => setConfirmandoExclusao(c.id)} title="Remover" aria-label={`Remover ${c.nome}`}>
                    <Icone nome="lixeira" tamanho={16} />
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
