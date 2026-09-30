import { useState } from 'react'
import CartaoPresente from './CartaoPresente'
import ModalCadastrarPresente from './ModalCadastrarPresente'
import ModalDetalhesPresente from './ModalDetalhesPresente'
import ModalConfirmacao from './ModalConfirmacao'
import Icone from './Icone'
import { esgotado } from '../hooks/usePresentes'

function Esqueleto() {
  return (
    <ul className="pres-grade" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="pres-cartao painel pres-esqueleto">
          <div className="pres-midia" />
          <div className="pres-corpo">
            <span className="esq esq-curto" />
            <span className="esq esq-longo" />
            <span className="esq esq-medio" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ModalReservar({ presente, aoConfirmar, aoCancelar }) {
  const [nome, setNome] = useState('')
  if (!presente) return null

  function confirmar(e) {
    e.preventDefault()
    aoConfirmar(presente, nome.trim())
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoCancelar()}>
      <form className="popup popup-sm" onSubmit={confirmar} role="dialog" aria-modal="true" aria-labelledby="reservar-titulo">
        <h2 id="reservar-titulo" className="popup-title titulo">Reservar presente</h2>
        <p className="popup-sub">
          Você vai reservar <strong>{presente.nome}</strong>. Assim ninguém escolhe o mesmo item.
        </p>
        <div className="field">
          <label htmlFor="reservar-nome">Seu nome <span className="muted">(opcional)</span></label>
          <input id="reservar-nome" type="text" placeholder="Para os anfitriões saberem" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>
        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={aoCancelar}>Cancelar</button>
          <button type="submit" className="btn btn-primary"><Icone nome="check" tamanho={15} /> Confirmar reserva</button>
        </div>
      </form>
    </div>
  )
}

function AbaPresentes({ presentes, carregando, cadastrar, reservar, remover }) {
  const [cadastrando, setCadastrando] = useState(false)
  const [detalheId, setDetalheId] = useState(null)
  const [reservando, setReservando] = useState(null)
  const [removendo, setRemovendo] = useState(null)

  // Progresso em unidades: um item com quantidade 3 conta como 3 presentes.
  const total = presentes.reduce((soma, p) => soma + p.quantidade, 0)
  const reservados = presentes.reduce((soma, p) => soma + Math.min(p.reservados, p.quantidade), 0)
  const disponiveis = total - reservados
  const percentual = total ? (reservados / total) * 100 : 0
  const todosReservados = presentes.length > 0 && presentes.every(esgotado)
  const detalhe = presentes.find((p) => p.id === detalheId) || null

  function abrirReserva(presente) {
    setDetalheId(null)
    setReservando(presente)
  }

  function confirmarReserva(presente, nome) {
    reservar(presente.id, nome)
    setReservando(null)
  }

  function confirmarRemocao() {
    if (removendo) remover(removendo.id)
    setRemovendo(null)
  }

  return (
    <div className="pres">
      <header className="pres-cab">
        <div>
          <h2 className="titulo">Lista de presentes</h2>
          <p className="pres-sub">Escolha um presente para celebrar esse momento especial.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCadastrando(true)}>
          <Icone nome="mais" tamanho={16} /> Cadastrar presente
        </button>
      </header>

      {carregando ? (
        <>
          <div className="painel pres-progresso pres-esqueleto" aria-hidden="true">
            <span className="esq esq-medio" />
            <span className="esq esq-barra" />
          </div>
          <Esqueleto />
          <span className="sr-only" role="status">Carregando presentes…</span>
        </>
      ) : presentes.length === 0 ? (
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

          {todosReservados && (
            <div className="pres-completo">
              <Icone nome="brilho" tamanho={18} />
              <p>
                <strong>Todos os presentes foram reservados.</strong> Obrigado a cada pessoa que escolheu um item —
                você pode cadastrar novos presentes quando quiser.
              </p>
            </div>
          )}

          <ul className="pres-grade">
            {presentes.map((p, i) => (
              <CartaoPresente
                key={p.id}
                presente={p}
                indice={i}
                aoReservar={abrirReserva}
                aoVerDetalhes={(presente) => setDetalheId(presente.id)}
              />
            ))}
          </ul>
        </>
      )}

      <ModalCadastrarPresente aberto={cadastrando} aoFechar={() => setCadastrando(false)} aoCadastrar={cadastrar} />

      <ModalDetalhesPresente
        presente={detalhe}
        aoFechar={() => setDetalheId(null)}
        aoReservar={abrirReserva}
        aoRemover={(presente) => {
          setDetalheId(null)
          setRemovendo(presente)
        }}
      />

      <ModalReservar
        key={reservando?.id}
        presente={reservando}
        aoConfirmar={confirmarReserva}
        aoCancelar={() => setReservando(null)}
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
