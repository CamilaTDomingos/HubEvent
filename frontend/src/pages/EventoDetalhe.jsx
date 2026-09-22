import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useConvidados } from '../hooks/useConvidados'
import { useDespesas } from '../hooks/useDespesas'
import Sidebar from '../components/Sidebar'
import ModalConfirmacao from '../components/ModalConfirmacao'
import LinhaDespesa from '../components/LinhaDespesa'
import GraficoDespesas from '../components/GraficoDespesas'
import NumeroAnimado from '../components/NumeroAnimado'

function EventoDetalhe() {
  const { id } = useParams()
  const [aba, setAba] = useState('convidados')
  const [evento, setEvento] = useState(null)

  const { convidados, carregando: carregandoConvidados, recarregar: recarregarConvidados } = useConvidados(id)
  const { despesas, carregando: carregandoDespesas, recarregar: recarregarDespesas } = useDespesas(id)

  const [nomeConvidado, setNomeConvidado] = useState('')
  const [emailConvidado, setEmailConvidado] = useState('')

  const [descDespesa, setDescDespesa] = useState('')
  const [valorDespesa, setValorDespesa] = useState('')
  const [categoriaDespesa, setCategoriaDespesa] = useState('')

  // Novos estados para parcelamento
  const [parcelar, setParcelar] = useState(false)
  const [numParcelas, setNumParcelas] = useState(2)
  const [primeiroVencimento, setPrimeiroVencimento] = useState('')

  const [editandoOrcamento, setEditandoOrcamento] = useState(false)
  const [novoOrcamento, setNovoOrcamento] = useState('')

  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)

  useEffect(() => {
    async function buscarEvento() {
      const { data } = await supabase.from('evento').select('*').eq('id', id).single()
      setEvento(data)
    }
    buscarEvento()
  }, [id])

  const confirmados = convidados.filter((c) => c.status_presenca === 'CONFIRMADO').length
  const pendentes = convidados.filter((c) => c.status_presenca === 'PENDENTE').length
  const recusados = convidados.filter((c) => c.status_presenca === 'RECUSADO').length

  const totalGasto = despesas.reduce((soma, d) => soma + Number(d.valor_total), 0)
  const orcamento = Number(evento?.orcamento_estimado) || 0
  const saldo = orcamento - totalGasto
  const percentualUsado = orcamento > 0 ? Math.min((totalGasto / orcamento) * 100, 100) : 0

  async function handleAdicionarConvidado(e) {
    e.preventDefault()
    if (!nomeConvidado) return

    const { error } = await supabase.from('convidado').insert({
      evento_id: id,
      nome: nomeConvidado,
      email: emailConvidado || null,
    })

    if (!error) {
      setNomeConvidado('')
      setEmailConvidado('')
      recarregarConvidados()
    }
  }

  async function handleAdicionarDespesa(e) {
    e.preventDefault()
    const valor = Number(valorDespesa)
    if (!descDespesa || !valorDespesa || valor < 0) return
    if (parcelar && (!primeiroVencimento || numParcelas < 2)) return

    const { data: novaDespesa, error } = await supabase
      .from('despesa')
      .insert({
        evento_id: id,
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
    recarregarDespesas()
  }

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return
    const { tipo, id: itemId } = confirmandoExclusao
    const tabela = tipo === 'despesa' ? 'despesa' : 'convidado'

    const { error } = await supabase.from(tabela).delete().eq('id', itemId)

    if (!error) {
      if (tipo === 'despesa') recarregarDespesas()
      else recarregarConvidados()
    }
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
      .eq('id', id)

    if (!error) {
      setEvento((atual) => ({ ...atual, orcamento_estimado: valor }))
      setEditandoOrcamento(false)
    }
  }

  function renderBadge(status) {
    if (status === 'CONFIRMADO') return <span className="badge badge-ok">Confirmado</span>
    if (status === 'RECUSADO') return <span className="badge badge-no">Recusado</span>
    return <span className="badge badge-pend">Pendente</span>
  }

  return (
    <div className="screen">
      <Sidebar />
      <div className="main">
        <div className="ev-header">
          <h2>{evento?.nome || 'Carregando...'}</h2>
          <div className="meta">
            {evento && new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div className="ev-tabs">
          <button
            className={`tab-btn ${aba === 'convidados' ? 'active' : ''}`}
            onClick={() => setAba('convidados')}
          >
            Convidados
          </button>
          <button
            className={`tab-btn ${aba === 'financeiro' ? 'active' : ''}`}
            onClick={() => setAba('financeiro')}
          >
            Financeiro
          </button>
        </div>

        <div className="page-body">
          {aba === 'convidados' && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-value">{convidados.length}</div>
                  <div className="stat-label">Total de convidados</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{confirmados}</div>
                  <div className="stat-label">Confirmados</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{pendentes}</div>
                  <div className="stat-label">Pendentes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{recusados}</div>
                  <div className="stat-label">Recusados</div>
                </div>
              </div>

              <form onSubmit={handleAdicionarConvidado} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Nome do convidado"
                  value={nomeConvidado}
                  onChange={(e) => setNomeConvidado(e.target.value)}
                  style={{ flex: 1, padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
                  required
                />
                <input
                  type="email"
                  placeholder="E-mail (opcional)"
                  value={emailConvidado}
                  onChange={(e) => setEmailConvidado(e.target.value)}
                  style={{ flex: 1, padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
                />
                <button type="submit" className="btn btn-primary">+ Adicionar</button>
              </form>

              {carregandoConvidados ? (
                <p>Carregando...</p>
              ) : (
                <table className="gst-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Status</th>
                      <th>Link RSVP</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {convidados.map((c) => (
                      <tr key={c.id}>
                        <td>{c.nome}</td>
                        <td>{c.email || '—'}</td>
                        <td>{renderBadge(c.status_presenca)}</td>
                        <td>
                          <a href={`/rsvp/${c.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--em)', fontSize: 12 }}>
                            Abrir link
                          </a>
                        </td>
                        <td>
                          <button
                            onClick={() => setConfirmandoExclusao({ tipo: 'convidado', id: c.id })}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12 }}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {aba === 'financeiro' && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  {editandoOrcamento ? (
                    <form onSubmit={salvarOrcamento} style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        autoFocus
                        value={novoOrcamento}
                        onChange={(e) => setNovoOrcamento(e.target.value)}
                        style={{ width: '100%', padding: '4px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--em)' }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm">✓</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditandoOrcamento(false)}>✕</button>
                    </form>
                  ) : (
                    <>
                      <div className="stat-value">
                        <NumeroAnimado valor={orcamento} prefixo="R$ " />
                      </div>
                      <div className="stat-label">
                        Orçamento total{' '}
                        <button
                          onClick={iniciarEdicaoOrcamento}
                          style={{ background: 'none', border: 'none', color: 'var(--em)', cursor: 'pointer', fontSize: 11 }}
                        >
                          (editar)
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--red)' }}>
                    <NumeroAnimado valor={totalGasto} prefixo="R$ " />
                  </div>
                  <div className="stat-label">Gasto até agora</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: saldo >= 0 ? 'var(--em)' : 'var(--red)' }}>
                    <NumeroAnimado valor={saldo} prefixo="R$ " />
                  </div>
                  <div className="stat-label">Saldo restante</div>
                </div>
              </div>

              {orcamento > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ height: 8, background: 'var(--bg-2)', borderRadius: 20, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percentualUsado}%`,
                        background: percentualUsado >= 100 ? 'var(--red)' : 'var(--em)',
                        transition: 'width 900ms ease',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                    {percentualUsado.toFixed(0)}% do orçamento utilizado
                  </p>
                </div>
              )}

              <div className="stat-card" style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Gastos por categoria</h4>
                <GraficoDespesas despesas={despesas} />
              </div>

              <form onSubmit={handleAdicionarDespesa} style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Descrição (ex: Buffet)"
                  value={descDespesa}
                  onChange={(e) => setDescDespesa(e.target.value)}
                  style={{ flex: 2, padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
                  required
                />
                <select
                  value={categoriaDespesa}
                  onChange={(e) => setCategoriaDespesa(e.target.value)}
                  style={{ flex: 1, padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="">Categoria</option>
                  <option>Local e Cerimônia</option>
                  <option>Buffet e Bebidas</option>
                  <option>Decoração</option>
                  <option>Fotografia e Vídeo</option>
                  <option>Vestuário</option>
                  <option>Música e Entretenimento</option>
                  <option>Convites e Papelaria</option>
                  <option>Transporte</option>
                  <option>Outros</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Valor (R$)"
                  value={valorDespesa}
                  onChange={(e) => setValorDespesa(e.target.value)}
                  style={{ flex: 1, padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
                  required
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={parcelar} onChange={(e) => setParcelar(e.target.checked)} />
                  Parcelar
                </label>

                {parcelar && (
                  <>
                    <input
                      type="number"
                      min="2"
                      placeholder="Nº parcelas"
                      value={numParcelas}
                      onChange={(e) => setNumParcelas(Number(e.target.value))}
                      style={{ width: 90, padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
                    />
                    <input
                      type="date"
                      value={primeiroVencimento}
                      onChange={(e) => setPrimeiroVencimento(e.target.value)}
                      style={{ padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
                    />
                  </>
                )}

                <button type="submit" className="btn btn-primary">+ Adicionar</button>
              </form>

              {carregandoDespesas ? (
                <p>Carregando...</p>
              ) : (
                <table className="gst-table">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Valor</th>
                      <th>Parcelamento</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.map((d) => (
                      <LinhaDespesa
                        key={d.id}
                        despesa={d}
                        aoExcluir={(despesaId) => setConfirmandoExclusao({ tipo: 'despesa', id: despesaId })}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      <ModalConfirmacao
        aberto={!!confirmandoExclusao}
        titulo="Excluir item"
        mensagem={
          confirmandoExclusao?.tipo === 'despesa'
            ? 'Tem certeza que deseja excluir essa despesa? Essa ação não pode ser desfeita.'
            : 'Tem certeza que deseja remover esse convidado? Essa ação não pode ser desfeita.'
        }
        textoConfirmar="Excluir"
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setConfirmandoExclusao(null)}
      />
    </div>
  )
}

export default EventoDetalhe