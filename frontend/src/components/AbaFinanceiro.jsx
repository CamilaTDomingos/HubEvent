import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ModalConfirmacao from './ModalConfirmacao'
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
import { moeda, dataISO, somarMeses } from '../utils/datas'

function AbaFinanceiro({ evento, despesas, convidados = [], carregando, recarregar, aoAtualizarOrcamento }) {
  const [descDespesa, setDescDespesa] = useState('')
  const [valorDespesa, setValorDespesa] = useState('')
  const [categoriaDespesa, setCategoriaDespesa] = useState('')
  const { categorias } = useCategorias('categoria_despesa')

  const [parcelar, setParcelar] = useState(false)
  const [numParcelas, setNumParcelas] = useState(2)
  const [primeiroVencimento, setPrimeiroVencimento] = useState('')
  const [dataPagamento, setDataPagamento] = useState(dataISO)
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

  const totalGasto = despesas.reduce((soma, d) => soma + Number(d.valor_total), 0)
  const orcamento = Number(evento?.orcamento_estimado) || 0
  const saldo = orcamento - totalGasto
  const percentualReal = orcamento > 0 ? (totalGasto / orcamento) * 100 : 0
  const percentualUsado = Math.min(percentualReal, 100)
  const estourou = orcamento > 0 && saldo < 0

  async function handleAdicionarDespesa(e) {
    e.preventDefault()
    const valor = Number(valorDespesa)
    if (!descDespesa || !valorDespesa || valor < 0) return
    if (parcelar && (!primeiroVencimento || numParcelas < 2)) return
    if (!parcelar && !dataPagamento) return

    const { data: novaDespesa, error } = await supabase
      .from('despesa')
      .insert({
        evento_id: evento.id,
        descricao: descDespesa,
        valor_total: valor,
        categoria_id: categoriaDespesa || null,
        parcelado: parcelar,
        vencimento: parcelar ? null : dataPagamento,
        // Sem escolha, quem pagou é o organizador (pago_por_id fica nulo).
        ...(pagadorEscolhido && { pago_por_id: pagadorEscolhido }),
      })
      .select()
      .single()

    if (error) return

    if (parcelar) {
      const valorParcela = Math.round((valor / numParcelas) * 100) / 100
      // A última parcela absorve a sobra do arredondamento (100 em 3× = 33,33 + 33,33 + 33,34).
      const valorUltima = Math.round((valor - valorParcela * (numParcelas - 1)) * 100) / 100
      const parcelas = Array.from({ length: numParcelas }, (_, i) => ({
        despesa_id: novaDespesa.id,
        numero: i + 1,
        valor: i === numParcelas - 1 ? valorUltima : valorParcela,
        vencimento: somarMeses(primeiroVencimento, i),
      }))
      await supabase.from('parcela').insert(parcelas)
    }

    setDescDespesa('')
    setValorDespesa('')
    setCategoriaDespesa('')
    setParcelar(false)
    setNumParcelas(2)
    setPrimeiroVencimento('')
    setDataPagamento(dataISO())
    setPagoPor('')
    recarregar()
  }

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return
    const { error } = await supabase.from('despesa').delete().eq('id', confirmandoExclusao)
    if (!error) recarregar()
    setConfirmandoExclusao(null)
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
              <span className="label">Gasto até agora</span>
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
        </div>

        <div className="painel fin-grafico">
          <h3 className="titulo">Por categoria</h3>
          <GraficoDespesas despesas={despesas} />
        </div>
      </section>

      <GraficoFluxoCaixa eventoId={evento?.id} despesas={despesas} orcamento={orcamento} dataEvento={evento?.data_inicio} />

      <form className="lancar" onSubmit={handleAdicionarDespesa}>
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
            required
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
            placeholder="Valor (R$)"
            aria-label="Valor"
            value={valorDespesa}
            onChange={(e) => setValorDespesa(e.target.value)}
            required
          />
          <label className="switch">
            <input type="checkbox" checked={parcelar} onChange={(e) => setParcelar(e.target.checked)} />
            <span className="switch-track" />
            <span className="switch-texto">Parcelar</span>
          </label>
          <button type="submit" className="btn btn-primary"><Icone nome="mais" tamanho={16} /> Adicionar</button>
        </div>

        {!parcelar && (
          <div className="lancar-parcelas-campos">
            <label className="label" htmlFor="data-pagamento">Data do pagamento</label>
            <input
              id="data-pagamento"
              className="input"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              required
            />
            <span className="muted">É o mês em que a despesa entra no fluxo de caixa.</span>
          </div>
        )}

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

        <div className={`lancar-parcelas ${parcelar ? 'aberto' : ''}`}>
          <div>
            <div className="lancar-parcelas-campos">
              <label className="label" htmlFor="num-parcelas">Parcelas</label>
              <input
                id="num-parcelas"
                className="input"
                type="number"
                min="2"
                value={numParcelas}
                onChange={(e) => setNumParcelas(Number(e.target.value))}
                tabIndex={parcelar ? 0 : -1}
              />
              <label className="label" htmlFor="primeiro-venc">1º vencimento</label>
              <input
                id="primeiro-venc"
                className="input"
                type="date"
                value={primeiroVencimento}
                onChange={(e) => setPrimeiroVencimento(e.target.value)}
                tabIndex={parcelar ? 0 : -1}
              />
              {valorDespesa > 0 && numParcelas >= 2 && (
                <span className="muted">
                  {numParcelas}× de {moeda(Math.round((Number(valorDespesa) / numParcelas) * 100) / 100)}
                </span>
              )}
            </div>
          </div>
        </div>
      </form>

      <section className="painel extrato">
        <div className="painel-cab">
          <h3 className="titulo">Despesas</h3>
          <span className="muted">
            {despesas.length} {despesas.length === 1 ? 'lançamento' : 'lançamentos'}
          </span>
        </div>

        {carregando ? (
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
