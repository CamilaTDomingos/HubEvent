import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ModalConfirmacao from './ModalConfirmacao'
import ModalPagamento from './ModalPagamento'
import LinhaDespesa from './LinhaDespesa'
import GraficoDespesas from './GraficoDespesas'
import GraficoFluxoCaixa from './GraficoFluxoCaixa'
import PainelRateio from './PainelRateio'
import ModalDivisao from './ModalDivisao'
import NumeroAnimado from './NumeroAnimado'
import Icone from './Icone'
import { Link } from 'react-router-dom'
import { useCategorias } from '../hooks/useCategorias'
import { useRateio } from '../hooks/useRateio'
import { pagadorDaDespesa } from '../utils/rateio'
import { moeda, hojeISO, dataMedia } from '../utils/datas'
import { dividir, montarPagamentos, resumoPagamentos, pagadoresConhecidos } from '../utils/pagamentos'

function AbaFinanceiro({ evento, despesas, convidados = [], carregando, recarregar, aoAtualizarOrcamento }) {
  const [descDespesa, setDescDespesa] = useState('')
  const [valorDespesa, setValorDespesa] = useState('')
  const [categoriaDespesa, setCategoriaDespesa] = useState('')
  const { categorias } = useCategorias('categoria_despesa')

  const [parcelar, setParcelar] = useState(false)
  const [comEntrada, setComEntrada] = useState(false)
  const [valorEntrada, setValorEntrada] = useState('')
  const [dataEntrada, setDataEntrada] = useState(hojeISO())
  const [numParcelas, setNumParcelas] = useState('2')
  const [vencimento, setVencimento] = useState(hojeISO())
  const [erroLancar, setErroLancar] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [pagoPor, setPagoPor] = useState('')

  const rateio = useRateio(evento?.id, despesas)
  const { participantes } = rateio
  // Com uma pessoa só não há o que dividir: os campos do rateio ficam escondidos.
  const temRateio = participantes.length > 1
  // Quem foi escolhido e depois saiu do rateio volta a ser o organizador.
  const pagadorEscolhido = participantes.some((p) => p.id === pagoPor) ? pagoPor : ''
  const [dividindo, setDividindo] = useState(null)

  const [editandoOrcamento, setEditandoOrcamento] = useState(false)
  const [novoOrcamento, setNovoOrcamento] = useState('')

  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)
  const [pagando, setPagando] = useState(null)
  const [desfazendo, setDesfazendo] = useState(null)

  const totalGasto = despesas.reduce((soma, d) => soma + Number(d.valor_total), 0)
  const orcamento = Number(evento?.orcamento_estimado) || 0
  const saldo = orcamento - totalGasto
  const percentualReal = orcamento > 0 ? (totalGasto / orcamento) * 100 : 0
  const percentualUsado = Math.min(percentualReal, 100)
  const estourou = orcamento > 0 && saldo < 0

  const pagamentos = resumoPagamentos(despesas)

  const valor = Number(valorDespesa)
  const entrada = comEntrada ? Number(valorEntrada) : 0
  const qtdParcelas = Number(numParcelas)
  const restante = Math.round((valor - entrada) * 100) / 100
  const previaParcelas = parcelar && valor > 0 && qtdParcelas >= 1 && restante > 0 ? dividir(restante, qtdParcelas) : null

  function validarLancamento() {
    if (!descDespesa.trim()) return 'Diga o que é a despesa.'
    if (!valorDespesa || isNaN(valor) || valor <= 0) return 'Informe um valor maior que zero.'
    if (!vencimento) return parcelar ? 'Informe o vencimento da 1ª parcela.' : 'Informe a data de vencimento.'
    if (!parcelar) return null
    if (comEntrada) {
      if (!valorEntrada || isNaN(entrada) || entrada <= 0) return 'Informe o valor da entrada.'
      if (entrada >= valor) return 'A entrada precisa ser menor que o valor total.'
      if (!dataEntrada) return 'Informe a data da entrada.'
    }
    const minimo = comEntrada ? 1 : 2
    if (!Number.isInteger(qtdParcelas) || qtdParcelas < minimo) return `O número de parcelas precisa ser ${minimo} ou mais.`
    return null
  }

  function limparLancamento() {
    setDescDespesa('')
    setValorDespesa('')
    setCategoriaDespesa('')
    setParcelar(false)
    setComEntrada(false)
    setValorEntrada('')
    setDataEntrada(hojeISO())
    setNumParcelas('2')
    setVencimento(hojeISO())
    setPagoPor('')
  }

  async function handleAdicionarDespesa(e) {
    e.preventDefault()
    const problema = validarLancamento()
    setErroLancar(problema)
    if (problema) return

    setSalvando(true)
    const { data: novaDespesa, error } = await supabase
      .from('despesa')
      .insert({
        evento_id: evento.id,
        descricao: descDespesa.trim(),
        valor_total: valor,
        categoria_id: categoriaDespesa || null,
        parcelado: parcelar,
        vencimento: parcelar && comEntrada ? dataEntrada : vencimento,
        // Sem escolha, quem pagou é o organizador (pago_por_id fica nulo).
        ...(pagadorEscolhido && { pago_por_id: pagadorEscolhido }),
      })
      .select()
      .single()

    if (error) {
      setSalvando(false)
      setErroLancar(error.message)
      return
    }

    const linhas = montarPagamentos({ valor, parcelar, comEntrada, valorEntrada: entrada, dataEntrada, numParcelas: qtdParcelas, vencimento })
    const { error: erroParcelas } = await supabase
      .from('parcela')
      .insert(linhas.map((p) => ({ ...p, despesa_id: novaDespesa.id })))
    setSalvando(false)

    if (erroParcelas) {
      // Não deixa uma despesa sem pagamentos para trás.
      await supabase.from('despesa').delete().eq('id', novaDespesa.id)
      setErroLancar(erroParcelas.message)
      return
    }

    limparLancamento()
    recarregar()
  }

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return
    const { error } = await supabase.from('despesa').delete().eq('id', confirmandoExclusao)
    if (!error) recarregar()
    setConfirmandoExclusao(null)
  }

  async function confirmarDesfazer() {
    if (!desfazendo) return
    const { error } = await supabase
      .from('parcela')
      .update({ pago: false, pago_em: null, ...('pago_por' in desfazendo && { pago_por: null }) })
      .eq('id', desfazendo.id)
    if (!error) recarregar()
    setDesfazendo(null)
  }

  function iniciarEdicaoOrcamento() {
    setNovoOrcamento(orcamento > 0 ? String(orcamento) : '')
    setEditandoOrcamento(true)
  }

  async function salvarOrcamento(e) {
    e.preventDefault()
    const valor = Number(novoOrcamento)
    if (isNaN(valor) || valor < 0) return

    const { error } = await supabase
      .from('evento')
      .update({ orcamento_estimado: valor })
      .eq('id', evento.id)

    if (!error) {
      aoAtualizarOrcamento(valor)
      setEditandoOrcamento(false)
    }
  }

  return (
    <div className="fin">
      <section className="fin-topo">
        <div className="painel fin-resumo">
          <div className="fin-numeros">
            <div className="fin-num">
              <span className="label">Orçamento</span>
              {editandoOrcamento ? (
                <form className="fin-orc-form" onSubmit={salvarOrcamento}>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    aria-label="Orçamento total em reais"
                    value={novoOrcamento}
                    onChange={(e) => setNovoOrcamento(e.target.value)}
                  />
                  <button type="submit" className="btn-icone ok" title="Salvar" aria-label="Salvar orçamento"><Icone nome="check" tamanho={17} /></button>
                  <button type="button" className="btn-icone" title="Cancelar" aria-label="Cancelar" onClick={() => setEditandoOrcamento(false)}><Icone nome="mais" tamanho={17} style={{ rotate: '45deg' }} /></button>
                </form>
              ) : (
                <button className="fin-orc" onClick={iniciarEdicaoOrcamento} title="Editar orçamento">
                  <strong className="titulo num">{orcamento > 0 ? moeda(orcamento) : 'Definir'}</strong>
                  <Icone nome="editar" tamanho={14} />
                </button>
              )}
            </div>
            <div className="fin-num">
              <span className="label">Total de despesas</span>
              <strong className="titulo num"><NumeroAnimado valor={totalGasto} prefixo="R$ " /></strong>
            </div>
            <div className="fin-num">
              <span className="label">{estourou ? 'Acima do orçamento' : 'Saldo disponível'}</span>
              <strong className={`titulo num ${estourou ? 'neg' : 'pos'}`}><NumeroAnimado valor={Math.abs(saldo)} prefixo={saldo < 0 ? '− R$ ' : 'R$ '} /></strong>
            </div>
          </div>

          {orcamento > 0 ? (
            <div className="medidor">
              <div className="medidor-trilho">
                <div className={`medidor-fill ${estourou ? 'neg' : percentualReal >= 85 ? 'alerta' : ''}`} style={{ width: `${percentualUsado}%` }} />
              </div>
              <div className="medidor-legenda">
                <span><strong className="num">{percentualReal.toFixed(0)}%</strong> do orçamento utilizado</span>
                {estourou && <span className="estourou">Excedido em {moeda(-saldo)}</span>}
              </div>
            </div>
          ) : (
            <p className="fin-dica">Defina um orçamento para acompanhar quanto ainda pode ser gasto.</p>
          )}

          <div className="fin-pag">
            <div className="fin-numeros fin-numeros-2">
              <div className="fin-num">
                <span className="label">Já pago</span>
                <strong className="titulo num pos"><NumeroAnimado valor={pagamentos.pago} prefixo="R$ " /></strong>
              </div>
              <div className="fin-num">
                <span className="label">Falta pagar</span>
                <strong className="titulo num"><NumeroAnimado valor={pagamentos.falta} prefixo="R$ " /></strong>
              </div>
            </div>
            <div className="medidor-trilho" aria-hidden="true">
              <div className="medidor-fill" style={{ width: `${pagamentos.percentual}%` }} />
            </div>
            <div className="medidor-legenda">
              <span><strong className="num">{pagamentos.percentual.toFixed(0)}%</strong> das despesas pago</span>
              {pagamentos.proxima && (
                <span>Próximo: <strong className="num">{moeda(pagamentos.proxima.valor)}</strong> em {dataMedia(pagamentos.proxima.vencimento)}</span>
              )}
            </div>
            {pagamentos.porPagador.length > 0 && (
              <ul className="fin-pagadores" aria-label="Quanto cada um pagou">
                {pagamentos.porPagador.map(([nome, total]) => (
                  <li key={nome}><span>{nome}</span> <strong className="num">{moeda(total)}</strong></li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="painel fin-grafico">
          <h3 className="titulo">Por categoria</h3>
          <GraficoDespesas despesas={despesas} />
        </div>
      </section>

      <GraficoFluxoCaixa eventoId={evento?.id} despesas={despesas} orcamento={orcamento} dataEvento={evento?.data_inicio} />

      <form className="lancar" onSubmit={handleAdicionarDespesa} noValidate>
        <div className="lancar-cab">
          <h3 className="titulo lancar-titulo">Nova despesa</h3>
          <Link to="/perfil" className="link lancar-gerenciar">Gerenciar categorias</Link>
        </div>
        <div className="lancar-campos">
          <input
            className="input lancar-desc"
            type="text"
            placeholder="O que foi? (ex: Buffet)"
            aria-label="Descrição"
            value={descDespesa}
            onChange={(e) => setDescDespesa(e.target.value)}
          />
          <select
            className="input"
            aria-label="Categoria"
            value={categoriaDespesa}
            onChange={(e) => setCategoriaDespesa(e.target.value)}
          >
            <option value="">{categorias.length ? 'Categoria' : 'Sem categorias'}</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor total (R$)"
            aria-label="Valor total"
            value={valorDespesa}
            onChange={(e) => setValorDespesa(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={salvando}><Icone nome="mais" tamanho={16} /> {salvando ? 'Salvando…' : 'Adicionar'}</button>
        </div>

        <div className="lancar-pagamento">
          <div className="lancar-forma" role="radiogroup" aria-label="Forma de pagamento">
            <button type="button" role="radio" aria-checked={!parcelar} onClick={() => setParcelar(false)}>À vista</button>
            <button type="button" role="radio" aria-checked={parcelar} onClick={() => setParcelar(true)}>Parcelado</button>
          </div>

          {!parcelar ? (
            <div className="lancar-parcelas-campos">
              <label className="label" htmlFor="venc-avista">Vencimento</label>
              <input id="venc-avista" className="input" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
          ) : (
            <>
              <label className="switch">
                <input type="checkbox" checked={comEntrada} onChange={(e) => setComEntrada(e.target.checked)} />
                <span className="switch-track" />
                <span className="switch-texto">Com entrada</span>
              </label>

              {comEntrada && (
                <div className="lancar-parcelas-campos">
                  <label className="label" htmlFor="valor-entrada">Entrada</label>
                  <input
                    id="valor-entrada"
                    className="input lancar-entrada"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="R$"
                    value={valorEntrada}
                    onChange={(e) => setValorEntrada(e.target.value)}
                  />
                  <label className="label" htmlFor="data-entrada">em</label>
                  <input id="data-entrada" className="input" type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />
                </div>
              )}

              <div className="lancar-parcelas-campos">
                <label className="label" htmlFor="num-parcelas">{comEntrada ? 'Restante em' : 'Parcelas'}</label>
                <input
                  id="num-parcelas"
                  className="input"
                  type="number"
                  min={comEntrada ? 1 : 2}
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(e.target.value)}
                />
                <label className="label" htmlFor="primeiro-venc">1º vencimento</label>
                <input id="primeiro-venc" className="input" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {temRateio && (
          <div className="lancar-parcelas-campos">
            <label className="label" htmlFor="pago-por">Pago por</label>
            <select id="pago-por" className="input" value={pagadorEscolhido} onChange={(e) => setPagoPor(e.target.value)}>
              {participantes.map((p) => (
                <option key={p.id} value={p.organizador ? '' : p.id}>{p.nome}{p.organizador ? ' (você)' : ''}</option>
              ))}
            </select>
            <span className="muted">Dividida igualmente entre os {participantes.length} participantes; dá para mudar depois no extrato.</span>
          </div>
        )}

        {previaParcelas && (
          <p className="lancar-previa muted">
            {comEntrada && entrada > 0 && <>Entrada de {moeda(entrada)} + </>}
            {qtdParcelas}× de {moeda(previaParcelas[0])}
            {previaParcelas.at(-1) !== previaParcelas[0] && <> (última de {moeda(previaParcelas.at(-1))})</>}
          </p>
        )}

        {erroLancar && <p className="erro-msg">{erroLancar}</p>}
      </form>

      <section className="painel extrato">
        <div className="painel-cab">
          <h3 className="titulo">Despesas</h3>
          <span className="muted">
            {despesas.length} {despesas.length === 1 ? 'lançamento' : 'lançamentos'}
          </span>
        </div>

        {carregando && despesas.length === 0 ? (
          <p className="muted painel-vazio">Carregando…</p>
        ) : despesas.length === 0 ? (
          <div className="painel-vazio">
            <Icone nome="carteira" tamanho={26} />
            <p>Nenhuma despesa lançada ainda.</p>
          </div>
        ) : (
          <ul className="extrato-lista">
            {despesas.map((d, i) => (
              <LinhaDespesa
                key={d.id}
                despesa={d}
                indice={i}
                aoExcluir={setConfirmandoExclusao}
                aoPagar={(despesa, parcela) => setPagando({ despesa, parcela })}
                aoDesfazer={setDesfazendo}
                pagador={temRateio ? pagadorDaDespesa(d, participantes)?.nome : null}
                aoDividir={temRateio ? setDividindo : null}
              />
            ))}
          </ul>
        )}
      </section>

      <PainelRateio eventoId={evento?.id} despesas={despesas} convidados={convidados} rateio={rateio} />

      {dividindo && (
        <ModalDivisao
          despesa={dividindo}
          participantes={participantes}
          cotas={rateio.cotas}
          aoFechar={() => setDividindo(null)}
          aoSalvar={recarregar}
        />
      )}

      {pagando && (
        <ModalPagamento
          despesa={pagando.despesa}
          parcela={pagando.parcela}
          pagadores={pagadoresConhecidos(despesas)}
          aoFechar={() => setPagando(null)}
          aoSalvar={recarregar}
        />
      )}

      <ModalConfirmacao
        aberto={!!desfazendo}
        titulo="Desmarcar pagamento?"
        mensagem="O pagamento volta a ficar pendente e a informação de quem pagou é apagada."
        textoConfirmar="Desmarcar"
        aoConfirmar={confirmarDesfazer}
        aoCancelar={() => setDesfazendo(null)}
      />

      <ModalConfirmacao
        aberto={!!confirmandoExclusao}
        titulo="Excluir despesa?"
        mensagem="Tem certeza que deseja excluir essa despesa? Essa ação não pode ser desfeita."
        textoConfirmar="Excluir"
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setConfirmandoExclusao(null)}
      />
    </div>
  )
}

export default AbaFinanceiro
