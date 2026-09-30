import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ModalConfirmacao from './ModalConfirmacao'
import LinhaDespesa from './LinhaDespesa'
import GraficoDespesas from './GraficoDespesas'
import NumeroAnimado from './NumeroAnimado'
import Icone from './Icone'
import { CATEGORIAS_DESPESA } from '../utils/categorias'
import { moeda } from '../utils/datas'

function AbaFinanceiro({ evento, despesas, carregando, recarregar, aoAtualizarOrcamento }) {
  const [descDespesa, setDescDespesa] = useState('')
  const [valorDespesa, setValorDespesa] = useState('')
  const [categoriaDespesa, setCategoriaDespesa] = useState('')

  const [parcelar, setParcelar] = useState(false)
  const [numParcelas, setNumParcelas] = useState(2)
  const [primeiroVencimento, setPrimeiroVencimento] = useState('')

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

    const { data: novaDespesa, error } = await supabase
      .from('despesa')
      .insert({
        evento_id: evento.id,
        descricao: descDespesa,
        valor_total: valor,
        categoria: categoriaDespesa || null,
        parcelado: parcelar,
      })
      .select()
      .single()

    if (error) return

    if (parcelar) {
      const valorParcela = Math.round((valor / numParcelas) * 100) / 100
      const parcelas = []
      const dataBase = new Date(primeiroVencimento)
      for (let i = 0; i < numParcelas; i++) {
        const vencimento = new Date(dataBase)
        vencimento.setMonth(vencimento.getMonth() + i)
        parcelas.push({
          despesa_id: novaDespesa.id,
          numero: i + 1,
          valor: valorParcela,
          vencimento: vencimento.toISOString().split('T')[0],
        })
      }
      await supabase.from('parcela').insert(parcelas)
    }

    setDescDespesa('')
    setValorDespesa('')
    setCategoriaDespesa('')
    setParcelar(false)
    setNumParcelas(2)
    setPrimeiroVencimento('')
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

      <form className="lancar" onSubmit={handleAdicionarDespesa}>
        <h3 className="titulo lancar-titulo">Nova despesa</h3>
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
            <option value="">Categoria</option>
            {CATEGORIAS_DESPESA.map((c) => (
              <option key={c.nome}>{c.nome}</option>
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
              <LinhaDespesa key={d.id} despesa={d} indice={i} aoExcluir={setConfirmandoExclusao} />
            ))}
          </ul>
        )}
      </section>

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
