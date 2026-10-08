import { useState } from 'react'
import { Link } from 'react-router-dom'
import CartaoPresente from './CartaoPresente'
import ModalCadastrarPresente from './ModalCadastrarPresente'
import ModalDetalhesPresente from './ModalDetalhesPresente'
import ModalConfirmacao from './ModalConfirmacao'
import Icone from './Icone'
import EsqueletoPresentes from './EsqueletoPresentes'
import { esgotado } from '../hooks/usePresentes'

function ModalRecebimento({ aberto, atual, aoSalvar, aoFechar }) {
  const [chave, setChave] = useState(atual?.chave || '')
  const [nome, setNome] = useState(atual?.nome || '')
  const [cidade, setCidade] = useState(atual?.cidade || '')
  const [salvando, setSalvando] = useState(false)
  if (!aberto) return null

  async function salvar(e) {
    e.preventDefault()
    if (!chave.trim() || !nome.trim()) return
    setSalvando(true)
    const ok = await aoSalvar({ chave: chave.trim(), nome: nome.trim(), cidade: cidade.trim() })
    setSalvando(false)
    if (ok) aoFechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="popup popup-sm" onSubmit={salvar} role="dialog" aria-modal="true" aria-labelledby="receb-titulo">
        <h2 id="receb-titulo" className="popup-title titulo">Receber por <em>Pix</em></h2>
        <p className="popup-sub">Convidados que preferirem presentear em dinheiro pagam o valor do presente direto na sua conta.</p>
        <div className="field">
          <label htmlFor="receb-chave">Chave Pix</label>
          <input id="receb-chave" type="text" placeholder="CPF, e-mail, telefone ou chave aleatória" value={chave} onChange={(e) => setChave(e.target.value)} required autoFocus />
          <p className="pres-ajuda">Telefone no formato +5511999999999; CPF ou CNPJ só com números.</p>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="receb-nome">Nome do titular</label>
            <input id="receb-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="receb-cidade">Cidade</label>
            <input id="receb-cidade" type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
        </div>
        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}

function RodapeOrganizador({ presente, aoAbrir }) {
  const { reservas, quantidade } = presente
  let resumo
  if (reservas.length === 0) resumo = <span className="pres-status muted">Ninguém escolheu ainda</span>
  else if (quantidade === 1) resumo = <span className="pres-status"><Icone nome="check" tamanho={14} /> {reservas[0].nome}</span>
  else resumo = <span className="pres-status"><Icone nome="usuarios" tamanho={14} /> {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'}</span>

  return (
    <>
      {resumo}
      <button className="btn btn-ghost btn-sm" onClick={() => aoAbrir(presente)}>Ver detalhes</button>
    </>
  )
}

function AbaPresentes({ eventoId, presentes, carregando, erro, cadastrar, editar, remover, recebimento, salvarRecebimento, siteUrl, siteAtivo }) {
  const [cadastrando, setCadastrando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [detalheId, setDetalheId] = useState(null)
  const [removendo, setRemovendo] = useState(null)
  const [editandoPix, setEditandoPix] = useState(false)

  // Progresso em unidades: um item com quantidade 3 conta como 3 presentes.
  const total = presentes.reduce((soma, p) => soma + p.quantidade, 0)
  const reservados = presentes.reduce((soma, p) => soma + Math.min(p.reservas.length, p.quantidade), 0)
  const disponiveis = total - reservados
  const percentual = total ? (reservados / total) * 100 : 0
  const todosReservados = presentes.length > 0 && presentes.every(esgotado)
  const detalhe = presentes.find((p) => p.id === detalheId) || null
  const editando = presentes.find((p) => p.id === editandoId) || null
  const abrir = (presente) => setDetalheId(presente.id)

  function confirmarRemocao() {
    if (removendo) remover(removendo.id)
    setRemovendo(null)
  }

  return (
    <div className="pres">
      <header className="pres-cab">
        <div>
          <h2 className="titulo">Lista de presentes</h2>
          <p className="pres-sub">Cadastre os presentes que seus convidados vão ver no site do evento.</p>
        </div>
        <div className="pres-cab-acoes">
          {siteUrl && (
            <a className="btn btn-secondary" href={siteUrl} target="_blank" rel="noopener noreferrer">
              <Icone nome="abrir" tamanho={15} /> Ver no site
            </a>
          )}
          <button className="btn btn-primary" onClick={() => setCadastrando(true)}>
            <Icone nome="mais" tamanho={16} /> Cadastrar presente
          </button>
        </div>
      </header>

      {!siteUrl && (
        <p className="pres-aviso">
          <Icone nome="globo" tamanho={16} />
          {siteAtivo ? (
            <span>
              Os convidados escolhem os presentes pelo site do evento, que ainda não foi publicado.{' '}
              <Link className="link" to={`/eventos/${eventoId}/site`}>Publicar site</Link>
            </span>
          ) : (
            <span>O módulo Site do evento está desativado, então os convidados ainda não conseguem ver esta lista.</span>
          )}
        </p>
      )}

      {erro && <p className="erro-msg">{erro}</p>}

      {carregando ? (
        <>
          <div className="painel pres-progresso pres-esqueleto" aria-hidden="true">
            <span className="esq esq-medio" />
            <span className="esq esq-barra" />
          </div>
          <EsqueletoPresentes />
          <span className="sr-only" role="status">Carregando presentes…</span>
        </>
      ) : (
        <>
          <div className="pres-resumo">
            <section className="painel pres-progresso" aria-label="Progresso da lista">
              <div className="pres-progresso-texto">
                <p>
                  <strong className="titulo num">{reservados}</strong> de <span className="num">{total}</span>{' '}
                  {total === 1 ? 'presente reservado' : 'presentes reservados'}
                </p>
                <span className="pres-disponiveis">
                  <span className="ponto" /> {disponiveis} {disponiveis === 1 ? 'disponível' : 'disponíveis'}
                </span>
              </div>
              <div className="medidor-trilho">
                <div className="medidor-fill" style={{ width: `${percentual}%` }} />
              </div>
            </section>

            <section className={`painel pres-pix ${recebimento ? '' : 'pendente'}`} aria-label="Recebimento por Pix">
              <span className="label">Recebimento por Pix</span>
              {recebimento ? (
                <>
                  <p className="pres-pix-chave">{recebimento.chave}</p>
                  <button className="link" onClick={() => setEditandoPix(true)}>Alterar</button>
                </>
              ) : (
                <>
                  <p className="pres-pix-dica">Sem chave, os convidados só podem comprar na loja.</p>
                  <button className="link" onClick={() => setEditandoPix(true)}>Configurar Pix <Icone nome="seta" tamanho={13} /></button>
                </>
              )}
            </section>
          </div>

          {presentes.length === 0 ? (
            <div className="painel pres-vazio">
              <span className="pres-vazio-selo"><Icone nome="presente" tamanho={24} /></span>
              <h3 className="titulo">Sua lista ainda está em branco</h3>
              <p>Cadastre o primeiro presente e compartilhe com quem vai celebrar com vocês.</p>
              <button className="btn btn-primary" onClick={() => setCadastrando(true)}>
                <Icone nome="mais" tamanho={16} /> Cadastrar primeiro presente
              </button>
            </div>
          ) : (
            <>
              {todosReservados && (
                <div className="pres-completo">
                  <Icone nome="brilho" tamanho={18} />
                  <p>
                    <strong>Todos os presentes foram reservados.</strong> Você pode cadastrar novos itens quando quiser.
                  </p>
                </div>
              )}

              <ul className="pres-grade">
                {presentes.map((p, i) => (
                  <CartaoPresente key={p.id} presente={p} indice={i} aoAbrir={abrir}>
                    <RodapeOrganizador presente={p} aoAbrir={abrir} />
                  </CartaoPresente>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <ModalCadastrarPresente
        key={editando?.id || 'novo'}
        aberto={cadastrando || !!editando}
        presente={editando}
        aoFechar={() => {
          setCadastrando(false)
          setEditandoId(null)
        }}
        aoSalvar={editando ? (dados) => editar(editando.id, dados) : cadastrar}
      />

      <ModalRecebimento
        key={editandoPix ? 'aberto' : 'fechado'}
        aberto={editandoPix}
        atual={recebimento}
        aoSalvar={salvarRecebimento}
        aoFechar={() => setEditandoPix(false)}
      />

      <ModalDetalhesPresente
        presente={detalhe}
        aoFechar={() => setDetalheId(null)}
        aoEditar={(presente) => {
          setDetalheId(null)
          setEditandoId(presente.id)
        }}
        aoRemover={(presente) => {
          setDetalheId(null)
          setRemovendo(presente)
        }}
      />

      <ModalConfirmacao
        aberto={!!removendo}
        titulo="Remover presente?"
        mensagem={`“${removendo?.nome}” sai da lista, junto com as reservas feitas para ele.`}
        textoConfirmar="Remover"
        aoConfirmar={confirmarRemocao}
        aoCancelar={() => setRemovendo(null)}
      />
    </div>
  )
}

export default AbaPresentes
