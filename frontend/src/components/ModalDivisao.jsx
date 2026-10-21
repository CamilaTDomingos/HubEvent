import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { iniciais } from '../utils/categorias'
import { moeda } from '../utils/datas'
import {
  DIVISOES,
  paraCentavos,
  paraReais,
  dividirIgual,
  percentuaisParaCentavos,
  conferirDivisao,
  pagadorDaDespesa,
} from '../utils/rateio'
import Icone from './Icone'

// Partes iguais já preenchidas, para a pessoa só ajustar o que muda.
function partesIguais(modo, total, ids) {
  const partes = modo === 'PERCENTUAL' ? dividirIgual(10000, ids) : dividirIgual(total, ids)
  return Object.fromEntries(ids.map((id) => [id, (partes[id] / 100).toFixed(2)]))
}

function porcentagem(pontos) {
  return `${(pontos / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

// Quem pagou a despesa e como ela se divide entre os participantes (RF03).
// Montado só enquanto está aberto, então o estado parte sempre da despesa certa.
function ModalDivisao({ despesa, participantes, cotas, aoFechar, aoSalvar }) {
  const total = paraCentavos(despesa.valor_total)
  const ids = participantes.map((p) => p.id)
  const cotasDaDespesa = cotas.filter((c) => c.despesa_id === despesa.id)
  const modoSalvo = despesa.divisao !== 'IGUAL' && cotasDaDespesa.length ? despesa.divisao : 'IGUAL'

  const [pagoPor, setPagoPor] = useState(pagadorDaDespesa(despesa, participantes)?.id ?? '')
  const [modo, setModo] = useState(modoSalvo)
  const [entradas, setEntradas] = useState(() => {
    if (modoSalvo === 'IGUAL') return {}
    const campo = modoSalvo === 'PERCENTUAL' ? 'percentual' : 'valor'
    return Object.fromEntries(ids.map((id) => {
      const cota = cotasDaDespesa.find((c) => c.participante_id === id)
      return [id, cota ? Number(cota[campo]).toFixed(2) : '']
    }))
  })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const conferencia = conferirDivisao(modo, total, entradas)
  const partesPercentuais = modo === 'PERCENTUAL' && conferencia.ok
    ? percentuaisParaCentavos(total, Object.fromEntries(ids.map((id) => [id, entradas[id] || 0])))
    : {}
  const partes = modo === 'IGUAL' ? dividirIgual(total, ids) : modo === 'VALOR'
    ? Object.fromEntries(ids.map((id) => [id, paraCentavos(entradas[id] || 0)]))
    : partesPercentuais

  function trocarModo(novo) {
    setModo(novo)
    setErro(null)
    if (novo !== 'IGUAL') setEntradas(partesIguais(novo, total, ids))
  }

  async function handleSalvar(e) {
    e.preventDefault()
    if (!conferencia.ok) return

    const comParte = ids.filter((id) => (modo === 'VALOR' ? paraCentavos(entradas[id]) : Math.round(Number(entradas[id] || 0) * 100)) > 0)
    const cotasNovas = modo === 'IGUAL' ? [] : comParte.map((id) => ({
      participante_id: id,
      valor: paraReais(partes[id]),
      ...(modo === 'PERCENTUAL' && { percentual: Math.round(Number(entradas[id]) * 100) / 100 }),
    }))
    // Despesa de R$ 0,00 não tem o que dividir: fica como igual.
    const divisao = cotasNovas.length ? modo : 'IGUAL'

    setSalvando(true)
    const { error } = await supabase.rpc('definir_rateio_despesa', {
      p_despesa: despesa.id,
      p_pago_por: pagoPor || null,
      p_divisao: divisao,
      p_cotas: cotasNovas,
    })
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }
    aoSalvar()
    aoFechar()
  }

  let situacao = null
  if (modo === 'VALOR') {
    situacao = conferencia.ok
      ? `Fecha com ${moeda(paraReais(total))}`
      : conferencia.diferenca > 0
        ? `Faltam ${moeda(paraReais(conferencia.diferenca))} para fechar ${moeda(paraReais(total))}`
        : `Passou ${moeda(paraReais(-conferencia.diferenca))} de ${moeda(paraReais(total))}`
  } else if (modo === 'PERCENTUAL') {
    situacao = conferencia.ok
      ? 'Fecha 100%'
      : conferencia.diferenca > 0
        ? `Faltam ${porcentagem(conferencia.diferenca)} para fechar 100%`
        : `Passou ${porcentagem(-conferencia.diferenca)} de 100%`
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="popup popup-divisao" onSubmit={handleSalvar} role="dialog" aria-modal="true" aria-labelledby="divisao-titulo">
        <h2 id="divisao-titulo" className="popup-title titulo">Dividir <em>despesa</em></h2>
        <p className="popup-sub">{despesa.descricao} · {moeda(despesa.valor_total)}</p>

        <div className="field">
          <label htmlFor="divisao-pago-por">Quem pagou</label>
          <select id="divisao-pago-por" value={pagoPor} onChange={(e) => setPagoPor(e.target.value)}>
            {participantes.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}{p.organizador ? ' (você)' : ''}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="label" id="divisao-modo">Como dividir</span>
          <div className="divisao-modos" role="group" aria-labelledby="divisao-modo">
            {Object.entries(DIVISOES).map(([chave, rotulo]) => (
              <button key={chave} type="button" className={modo === chave ? 'sel' : ''} aria-pressed={modo === chave} onClick={() => trocarModo(chave)}>
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        <ul className="divisao-lista">
          {participantes.map((p) => (
            <li key={p.id}>
              <span className="avatar" aria-hidden="true">{iniciais(p.nome)}</span>
              <label className="divisao-nome" htmlFor={`divisao-${p.id}`}>{p.nome}</label>
              {modo === 'IGUAL' ? (
                <span className="divisao-valor num">{moeda(paraReais(partes[p.id] ?? 0))}</span>
              ) : (
                <span className="divisao-campo">
                  {modo === 'PERCENTUAL' && (
                    <span className="muted num">{partes[p.id] !== undefined ? moeda(paraReais(partes[p.id])) : '—'}</span>
                  )}
                  <span className="divisao-entrada">
                    {modo === 'VALOR' && <span className="muted">R$</span>}
                    <input
                      id={`divisao-${p.id}`}
                      className="input num"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      max={modo === 'PERCENTUAL' ? 100 : undefined}
                      value={entradas[p.id] ?? ''}
                      placeholder="0,00"
                      onChange={(e) => setEntradas((atual) => ({ ...atual, [p.id]: e.target.value }))}
                    />
                    {modo === 'PERCENTUAL' && <span className="muted">%</span>}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>

        {modo === 'IGUAL' ? (
          <p className="divisao-situacao muted">
            {participantes.length > 1
              ? 'Entre todos os participantes. Se alguém entrar ou sair do rateio, a divisão se ajusta sozinha.'
              : 'Adicione participantes no painel Rateio para dividir esta despesa.'}
          </p>
        ) : (
          <p className={`divisao-situacao ${conferencia.ok ? 'ok' : 'neg'}`} role="status">
            <Icone nome={conferencia.ok ? 'check' : 'ajuda'} tamanho={15} /> {situacao}
          </p>
        )}

        {erro && <p className="erro-msg">{erro}</p>}

        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando || !conferencia.ok}>
            {salvando ? 'Salvando…' : 'Salvar divisão'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ModalDivisao
