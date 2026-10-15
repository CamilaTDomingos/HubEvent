import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCategorias } from '../hooks/useCategorias'
import ModalConfirmacao from './ModalConfirmacao'
import ModalConvidado from './ModalConvidado'
import { PainelCategorias } from './GerenciarCategorias'
import SeloCategoria from './SeloCategoria'
import NumeroAnimado from './NumeroAnimado'
import Icone from './Icone'
import { iniciais, TERMO_GRUPO } from '../utils/categorias'
import { acompanhantesConfirmados, acompanhantesPermitidos, buscarConvidados, foiEnviado, resumoConvidados } from '../utils/convidados'
import { dataCurta } from '../utils/datas'

const STATUS = {
  CONFIRMADO: { label: 'Confirmado', plural: 'Confirmados', badge: 'badge-ok' },
  PENDENTE: { label: 'Pendente', plural: 'Pendentes', badge: 'badge-pend' },
  RECUSADO: { label: 'Recusou', plural: 'Recusaram', badge: 'badge-no' },
}

// Filtros da lateral: os três status e, à parte, o envio do convite.
const FILTROS = {
  CONFIRMADO: { ...STATUS.CONFIRMADO, conta: 'confirmados', teste: (c) => c.status_presenca === 'CONFIRMADO' },
  PENDENTE: { ...STATUS.PENDENTE, conta: 'pendentes', teste: (c) => c.status_presenca === 'PENDENTE' },
  RECUSADO: { ...STATUS.RECUSADO, conta: 'recusados', teste: (c) => c.status_presenca === 'RECUSADO' },
  ENVIADO: { plural: 'Enviados', conta: 'enviados', teste: foiEnviado },
  NAO_ENVIADO: { plural: 'Não enviados', conta: 'naoEnviados', teste: (c) => !foiEnviado(c) },
}
const FILTROS_STATUS = ['CONFIRMADO', 'PENDENTE', 'RECUSADO']
const FILTROS_ENVIO = ['ENVIADO', 'NAO_ENVIADO']

function textoAcompanhantes(c) {
  const permitidos = acompanhantesPermitidos(c)
  if (c.status_presenca === 'CONFIRMADO' && permitidos > 0) return { forte: `+${acompanhantesConfirmados(c)}`, fraco: `de ${permitidos}` }
  if (permitidos > 0) return { forte: null, fraco: `até ${permitidos}` }
  return { forte: null, fraco: '—' }
}

function AbaConvidados({ eventoId, convidados, carregando, recarregar }) {
  const grupos = useCategorias('grupo_convidado', eventoId)
  const [filtro, setFiltro] = useState(null)
  const [busca, setBusca] = useState('')
  const [copiado, setCopiado] = useState(null)
  const [modal, setModal] = useState(null) // null | 'novo' | convidado
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)

  const resumo = resumoConvidados(convidados)
  const percentual = resumo.total ? Math.round((resumo.confirmados / resumo.total) * 100) : 0
  const filtrados = filtro ? convidados.filter(FILTROS[filtro].teste) : convidados
  const lista = buscarConvidados(filtrados, busca)
  const grupoPorId = Object.fromEntries(grupos.categorias.map((g) => [g.id, g]))

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return
    const { error } = await supabase.from('convidado').delete().eq('id', confirmandoExclusao)
    if (!error) recarregar()
    setConfirmandoExclusao(null)
  }

  // Copiar o link é o jeito mais comum de enviar o convite, então já marca
  // como enviado. Dá para desfazer no "Editar".
  async function marcarEnviado(c) {
    if (foiEnviado(c)) return
    const { error } = await supabase.from('convidado').update({ enviado_em: new Date().toISOString() }).eq('id', c.id)
    if (!error) recarregar()
  }

  async function copiarLink(c) {
    const url = `${window.location.origin}/rsvp/${c.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(c.id)
      setTimeout(() => setCopiado((atual) => (atual === c.id ? null : atual)), 1800)
    } catch {
      window.prompt('Copie o link do convite:', url)
    }
    marcarEnviado(c)
  }

  async function removerGrupo(id) {
    const falha = await grupos.remover(id)
    // O banco deixou os convidados do grupo sem grupo.
    if (!falha) recarregar()
    return falha
  }

  function botaoFiltro(chave) {
    const info = FILTROS[chave]
    return (
      <button
        key={chave}
        className={`filtro-item st-${chave.toLowerCase()} ${filtro === chave ? 'sel' : ''}`}
        aria-pressed={filtro === chave}
        onClick={() => setFiltro(filtro === chave ? null : chave)}
      >
        <span className="ponto" />
        {info.plural}
        <strong className="num">{resumo[info.conta]}</strong>
      </button>
    )
  }

  return (
    <div className="conv">
      <aside className="conv-lateral">
        <section className="painel rsvp-resumo">
          <p className="eyebrow">Pessoas confirmadas</p>
          <div className="rsvp-numero">
            <strong className="titulo num" data-testid="pessoas-confirmadas"><NumeroAnimado valor={resumo.pessoasConfirmadas} casas={0} /></strong>
            <span className="rsvp-pct" title="Convites confirmados">{percentual}%</span>
          </div>
          <p className="rsvp-composicao">
            {resumo.confirmados} {resumo.confirmados === 1 ? 'convidado' : 'convidados'} + {resumo.acompanhantes} {resumo.acompanhantes === 1 ? 'acompanhante' : 'acompanhantes'}
            {resumo.pendentes > 0 && (
              <span className="rsvp-ate">Até {resumo.pessoasPossiveis} se todos os pendentes vierem</span>
            )}
          </p>

          <div className="barra-rsvp" aria-hidden="true">
            {FILTROS_STATUS.map((s) =>
              resumo[FILTROS[s].conta] > 0 ? (
                <span
                  key={s}
                  className={`barra-seg seg-${s.toLowerCase()} ${filtro && filtro !== s ? 'apagado' : ''}`}
                  style={{ flexGrow: resumo[FILTROS[s].conta] }}
                />
              ) : null
            )}
          </div>

          <div className="filtro-status" role="group" aria-label="Filtrar por status">
            {FILTROS_STATUS.map(botaoFiltro)}
          </div>
          <p className="eyebrow filtro-titulo">Convites ({resumo.total})</p>
          <div className="filtro-status" role="group" aria-label="Filtrar por envio">
            {FILTROS_ENVIO.map(botaoFiltro)}
          </div>
        </section>

        <PainelCategorias
          colecao={{ ...grupos, remover: removerGrupo }}
          dono={{ evento_id: eventoId }}
          termo={TERMO_GRUPO}
          titulo="Grupos"
          textoVazio="Nenhum grupo ainda. Crie grupos como Família ou Trabalho para organizar a lista."
          textoRemocao={(nome) => `Os convidados do grupo "${nome}" não serão apagados, só ficarão sem grupo.`}
        />
      </aside>

      <section className="painel conv-principal">
        <div className="painel-cab">
          <h3 className="titulo">{filtro ? FILTROS[filtro].plural : 'Lista de convidados'}</h3>
          {filtro ? (
            <button className="link" onClick={() => setFiltro(null)}>Mostrar todos</button>
          ) : (
            <span className="muted">{resumo.total} {resumo.total === 1 ? 'convite' : 'convites'}</span>
          )}
        </div>

        <div className="conv-ferramentas">
          <label className="conv-busca">
            <span className="sr-only">Buscar convidado</span>
            <Icone nome="busca" tamanho={16} />
            <input type="search" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('novo')}>
            <Icone nome="mais" tamanho={15} /> Adicionar convidado
          </button>
        </div>

        {carregando ? (
          <p className="muted painel-vazio">Carregando…</p>
        ) : lista.length === 0 ? (
          <div className="painel-vazio">
            <Icone nome="usuarios" tamanho={26} />
            <p>
              {resumo.total === 0
                ? 'Ninguém na lista ainda. Adicione o primeiro convidado.'
                : busca.trim()
                  ? `Ninguém encontrado para "${busca.trim()}".`
                  : 'Ninguém com esse status.'}
            </p>
          </div>
        ) : (
          <ul className="conv-lista">
            <li className="conv-linha conv-cab" aria-hidden="true">
              <span />
              <span>Convidado</span>
              <span>Grupo</span>
              <span>Acompanhantes</span>
              <span>Status</span>
              <span />
            </li>
            {lista.map((c, i) => {
              const acomp = textoAcompanhantes(c)
              const grupo = grupoPorId[c.grupo_id]
              return (
                <li key={c.id} className="conv-linha" style={{ '--i': i }}>
                  <span className="avatar" aria-hidden="true">{iniciais(c.nome)}</span>
                  <div className="conv-nome">
                    <strong>{c.nome}</strong>
                    <span>{c.email || 'Sem e-mail'}</span>
                  </div>
                  <div className="conv-grupo">
                    {grupo ? <SeloCategoria categoria={grupo} /> : <span className="muted">Sem grupo</span>}
                  </div>
                  <div className="conv-acomp" title={acompanhantesPermitidos(c) ? `Pode levar até ${acompanhantesPermitidos(c)}` : 'Convite individual'}>
                    {acomp.forte && <strong className="num">{acomp.forte}</strong>} <span>{acomp.fraco}</span>
                  </div>
                  <div className="conv-status">
                    <span className={`badge ${STATUS[c.status_presenca]?.badge}`}>{STATUS[c.status_presenca]?.label}</span>
                    {c.status_presenca === 'PENDENTE' && (
                      <span className="conv-envio">{c.enviado_em ? `Enviado em ${dataCurta(c.enviado_em)}` : 'Não enviado'}</span>
                    )}
                  </div>
                  <div className="conv-acoes">
                    {copiado === c.id ? (
                      <span className="copiado"><Icone nome="check" tamanho={15} /> Link copiado</span>
                    ) : (
                      <button className="btn-icone" onClick={() => copiarLink(c)} title="Copiar link do convite" aria-label={`Copiar link do convite de ${c.nome}`}>
                        <Icone nome="copiar" tamanho={16} />
                      </button>
                    )}
                    <a className="btn-icone" href={`/rsvp/${c.id}`} target="_blank" rel="noreferrer" title="Abrir convite" aria-label={`Abrir convite de ${c.nome}`}>
                      <Icone nome="abrir" tamanho={16} />
                    </a>
                    <button className="btn-icone" onClick={() => setModal(c)} title="Editar" aria-label={`Editar ${c.nome}`}>
                      <Icone nome="editar" tamanho={16} />
                    </button>
                    <button className="btn-icone perigo" onClick={() => setConfirmandoExclusao(c.id)} title="Remover" aria-label={`Remover ${c.nome}`}>
                      <Icone nome="lixeira" tamanho={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {modal && (
        <ModalConvidado
          convidado={modal === 'novo' ? null : modal}
          eventoId={eventoId}
          grupos={grupos.categorias}
          aoFechar={() => setModal(null)}
          aoSalvar={recarregar}
        />
      )}

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
