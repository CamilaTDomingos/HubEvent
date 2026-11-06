import Dropdown from './Dropdown'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { moeda, hojeISO } from '../utils/datas'

// Marca um pagamento como pago, registrando quem pagou e quando.
// Sem `parcela` (despesa antiga, sem pagamentos), cria o pagamento único.
const EXTERNO = '__externo__'

function ModalPagamento({ despesa, parcela, participantes = [], aoFechar, aoSalvar }) {
  // Vazio = organizador (mesma regra do rateio); EXTERNO = alguém de fora do rateio.
  const [pagoPor, setPagoPor] = useState('')
  const [nomeExterno, setNomeExterno] = useState('')
  const [ratear, setRatear] = useState(true)
  const [data, setData] = useState(hojeISO())
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const valor = parcela ? parcela.valor : despesa.valor_total
  const rotulo = !parcela || despesa.parcela.length === 1
    ? despesa.descricao
    : parcela.entrada ? `Entrada · ${despesa.descricao}` : `Parcela ${parcela.numero} · ${despesa.descricao}`

  const externo = pagoPor === EXTERNO
  const organizador = participantes.find((p) => p.organizador) ?? participantes[0]
  const pagador = externo ? null : (participantes.find((p) => p.id === pagoPor) ?? organizador)

  async function handleSalvar(e) {
    e.preventDefault()
    if (!data) {
      setErro('Informe a data do pagamento.')
      return
    }

    if (externo && !nomeExterno.trim()) {
      setErro('Informe o nome de quem pagou.')
      return
    }

    const dados = {
      pago: true,
      pago_em: new Date(`${data}T12:00:00`).toISOString(),
      ...(externo
        ? { pago_externo: true, pago_por: nomeExterno.trim() }
        : pagador && { pago_externo: false, ratear, pago_por_id: pagador.id, pago_por: pagador.nome }),
    }

    setSalvando(true)
    const { error } = parcela
      ? await supabase.from('parcela').update(dados).eq('id', parcela.id)
      : await supabase.from('parcela').insert({
          ...dados,
          despesa_id: despesa.id,
          numero: 1,
          valor: despesa.valor_total,
          vencimento: despesa.vencimento || data,
        })
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }

    aoSalvar()
    aoFechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="popup popup-sm" onSubmit={handleSalvar} role="dialog" aria-modal="true" aria-labelledby="pagamento-titulo">
        <h2 id="pagamento-titulo" className="popup-title titulo">Registrar <em>pagamento</em></h2>
        <p className="popup-sub">{rotulo}: <strong className="num">{moeda(valor)}</strong></p>

        <div className="field">
          <label htmlFor="pagamento-quem">Quem pagou</label>
          <Dropdown
            id="pagamento-quem"
            valor={externo ? EXTERNO : (pagador?.id ?? '')}
            aoMudar={setPagoPor}
            autoFocus
            opcoes={[
              ...participantes.map((p) => ({ valor: p.id, rotulo: `${p.nome}${p.organizador ? ' (você)' : ''}` })),
              { valor: EXTERNO, rotulo: 'Outra pessoa (fora do rateio)' },
            ]}
          />
        </div>
        {!externo && participantes.length > 1 && (
          <div className="switch-campo">
            <label className="switch">
              <input type="checkbox" checked={ratear} onChange={(e) => setRatear(e.target.checked)} />
              <span className="switch-track" />
              <span className="switch-texto">Ratear entre os participantes</span>
            </label>
            {!ratear && <p className="muted">Esse pagamento fica fora da divisão: ninguém passa a dever por ele.</p>}
          </div>
        )}
        {externo && (
          <div className="field">
            <label htmlFor="pagamento-externo">Nome</label>
            <input
              id="pagamento-externo"
              type="text"
              placeholder="Ex.: pais da noiva"
              maxLength={120}
              value={nomeExterno}
              onChange={(e) => setNomeExterno(e.target.value)}
              autoFocus
            />
            <p className="muted">Esse valor não entra na divisão entre os participantes.</p>
          </div>
        )}
        <div className="field">
          <label htmlFor="pagamento-data">Pago em</label>
          <input id="pagamento-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>

        {erro && <p className="erro-msg">{erro}</p>}

        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Marcar como pago'}</button>
        </div>
      </form>
    </div>
  )
}

export default ModalPagamento
