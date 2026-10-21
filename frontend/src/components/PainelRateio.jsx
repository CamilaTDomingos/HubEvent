import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { iniciais } from '../utils/categorias'
import { moeda, dataMedia } from '../utils/datas'
import { calcularRateio, motivoParaNaoRemover, paraReais } from '../utils/rateio'
import ModalConfirmacao from './ModalConfirmacao'
import Icone from './Icone'

function Saldo({ centavos }) {
  if (centavos > 0) return <span className="rateio-saldo pos">recebe <strong className="num">{moeda(paraReais(centavos))}</strong></span>
  if (centavos < 0) return <span className="rateio-saldo neg">deve <strong className="num">{moeda(paraReais(-centavos))}</strong></span>
  return <span className="rateio-saldo">em dia</span>
}

// Quem divide os custos do evento, quanto cada um pagou e deveria pagar,
// e quem precisa pagar quem para todo mundo ficar quite (RF03).
function PainelRateio({ eventoId, despesas, convidados, rateio }) {
  const { participantes, cotas, pagamentos, carregando, erro, recarregar } = rateio
  const [nome, setNome] = useState('')
  const [aviso, setAviso] = useState(null)
  const [removendo, setRemovendo] = useState(null)
  const [desfazendo, setDesfazendo] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const { pessoas, acertos } = calcularRateio({ despesas, participantes, cotas, pagamentos })
  const nomeDe = Object.fromEntries(participantes.map((p) => [p.id, p.nome]))
  const vinculados = new Set(participantes.map((p) => p.convidado_id).filter(Boolean))
  const convidadosLivres = convidados.filter((c) => !vinculados.has(c.id))

  async function handleAdicionar(e) {
    e.preventDefault()
    const limpo = nome.trim()
    if (!limpo) return
    if (participantes.some((p) => p.nome.toLowerCase() === limpo.toLowerCase())) {
      setAviso(`${limpo} já está no rateio.`)
      return
    }
    // Se o nome é o de um convidado, o participante fica ligado a ele.
    const convidado = convidadosLivres.find((c) => c.nome.trim().toLowerCase() === limpo.toLowerCase())

    setOcupado(true)
    const { error } = await supabase
      .from('participante_rateio')
      .insert({ evento_id: eventoId, nome: limpo, convidado_id: convidado?.id ?? null })
    setOcupado(false)

    if (error) {
      setAviso(error.message)
      return
    }
    setNome('')
    setAviso(null)
    recarregar()
  }

  function pedirRemocao(participante) {
    const motivo = motivoParaNaoRemover(participante, { despesas, cotas, pagamentos })
    if (motivo) {
      setAviso(motivo)
      return
    }
    setAviso(null)
    setRemovendo(participante)
  }

  async function confirmarRemocao() {
    const { error } = await supabase.from('participante_rateio').delete().eq('id', removendo.id)
    // O banco também recusa (chave estrangeira) se algo mudou desde a última busca.
    if (error) setAviso(`Não deu para remover ${removendo.nome}: ${error.message}`)
    setRemovendo(null)
    recarregar()
  }

  async function quitar(acerto) {
    setOcupado(true)
    const { error } = await supabase
      .from('pagamento_rateio')
      .insert({ evento_id: eventoId, de_id: acerto.de, para_id: acerto.para, valor: paraReais(acerto.valor) })
    setOcupado(false)
    if (error) setAviso(error.message)
    else recarregar()
  }

  async function confirmarDesfazer() {
    const { error } = await supabase.from('pagamento_rateio').delete().eq('id', desfazendo.id)
    if (error) setAviso(error.message)
    setDesfazendo(null)
    recarregar()
  }

  const cabecalho = (
    <div className="painel-cab">
      <h3 className="titulo">Rateio</h3>
      <span className="muted">
        {participantes.length} {participantes.length === 1 ? 'participante' : 'participantes'}
      </span>
    </div>
  )

  if (erro) {
    return (
      <section className="painel rateio">
        {cabecalho}
        <p className="muted painel-vazio">Não foi possível carregar o rateio. {erro}</p>
      </section>
    )
  }

  const sozinho = participantes.length <= 1

  return (
    <section className="painel rateio">
      {cabecalho}

      <div className="rateio-corpo">
        <div className="rateio-pessoas">
          {carregando && participantes.length === 0 ? (
            <p className="muted">Carregando…</p>
          ) : (
            <ul className="rateio-lista">
              {pessoas.map(({ participante: p, pagou, parte, saldo }) => (
                <li key={p.id} className="rateio-pessoa">
                  <span className="avatar" aria-hidden="true">{iniciais(p.nome)}</span>
                  <div className="rateio-nome">
                    <strong>
                      {p.nome}
                      {p.organizador && <span className="rateio-tag">você</span>}
                      {p.convidado_id && <span className="rateio-tag">convidado</span>}
                    </strong>
                    <span className="num">pagou {moeda(paraReais(pagou))} · parte {moeda(paraReais(parte))}</span>
                  </div>
                  <Saldo centavos={saldo} />
                  {!p.organizador ? (
                    <button type="button" className="btn-icone perigo" onClick={() => pedirRemocao(p)} title="Remover do rateio" aria-label={`Remover ${p.nome} do rateio`}>
                      <Icone nome="lixeira" tamanho={16} />
                    </button>
                  ) : <span />}
                </li>
              ))}
            </ul>
          )}

          <form className="rateio-adicionar" onSubmit={handleAdicionar}>
            <input
              className="input"
              type="text"
              list="rateio-convidados"
              maxLength={80}
              placeholder="Nome ou convidado"
              aria-label="Nome de quem divide os custos"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <datalist id="rateio-convidados">
              {convidadosLivres.map((c) => <option key={c.id} value={c.nome} />)}
            </datalist>
            <button type="submit" className="btn btn-secondary btn-sm" disabled={ocupado || !nome.trim()}>
              <Icone nome="mais" tamanho={15} /> Adicionar
            </button>
          </form>
          {aviso && <p className="erro-msg" role="alert">{aviso}</p>}
        </div>

        <div className="rateio-acertos">
          <span className="label">Acertos</span>
          {sozinho ? (
            <div className="rateio-vazio">
              <Icone nome="usuarios" tamanho={24} />
              <p>Adicione quem divide os custos com você. As despesas passam a ser divididas igualmente, e dá para ajustar cada uma no extrato.</p>
            </div>
          ) : acertos.length === 0 ? (
            <div className="rateio-vazio">
              <Icone nome="check" tamanho={24} />
              <p>Tudo certo: ninguém deve nada a ninguém.</p>
            </div>
          ) : (
            <>
              <ul className="rateio-lista">
                {acertos.map((a) => (
                  <li key={`${a.de}-${a.para}`} className="acerto">
                    <span className="acerto-texto">
                      <strong>{nomeDe[a.de]}</strong> paga <strong className="num">{moeda(paraReais(a.valor))}</strong> para <strong>{nomeDe[a.para]}</strong>
                    </span>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={ocupado} onClick={() => quitar(a)}>
                      <Icone nome="check" tamanho={15} /> Quitado
                    </button>
                  </li>
                ))}
              </ul>
              <p className="rateio-nota muted">Lista simplificada: quem deve mais paga primeiro a quem tem mais a receber.</p>
            </>
          )}

          {pagamentos.length > 0 && (
            <>
              <span className="label rateio-historico-titulo">Acertos quitados</span>
              <ul className="rateio-lista rateio-historico">
                {pagamentos.map((pg) => (
                  <li key={pg.id} className="acerto quitado">
                    <span className="acerto-texto">
                      {nomeDe[pg.de_id]} pagou <span className="num">{moeda(pg.valor)}</span> a {nomeDe[pg.para_id]}
                      <span className="muted"> · {dataMedia(pg.pago_em)}</span>
                    </span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDesfazendo(pg)}>Desfazer</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <ModalConfirmacao
        aberto={!!removendo}
        titulo="Remover do rateio?"
        mensagem={`${removendo?.nome ?? ''} sai do rateio, e as despesas divididas igualmente passam a ser divididas entre os outros participantes.`}
        textoConfirmar="Remover"
        aoConfirmar={confirmarRemocao}
        aoCancelar={() => setRemovendo(null)}
      />

      <ModalConfirmacao
        aberto={!!desfazendo}
        titulo="Desfazer acerto?"
        mensagem={desfazendo ? `O pagamento de ${moeda(desfazendo.valor)} de ${nomeDe[desfazendo.de_id]} para ${nomeDe[desfazendo.para_id]} deixa de contar no saldo.` : ''}
        textoConfirmar="Desfazer"
        aoConfirmar={confirmarDesfazer}
        aoCancelar={() => setDesfazendo(null)}
      />
    </section>
  )
}

export default PainelRateio
