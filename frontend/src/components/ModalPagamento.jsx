import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { moeda, hojeISO } from '../utils/datas'

// Marca um pagamento como pago, registrando quem pagou e quando.
// Sem `parcela` (despesa antiga, sem pagamentos), cria o pagamento único.
function ModalPagamento({ despesa, parcela, pagadores, aoFechar, aoSalvar }) {
  const [pagoPor, setPagoPor] = useState('')
  const [data, setData] = useState(hojeISO())
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const valor = parcela ? parcela.valor : despesa.valor_total
  const rotulo = !parcela || despesa.parcela.length === 1
    ? despesa.descricao
    : parcela.entrada ? `Entrada · ${despesa.descricao}` : `Parcela ${parcela.numero} · ${despesa.descricao}`

  async function handleSalvar(e) {
    e.preventDefault()
    if (!data) {
      setErro('Informe a data do pagamento.')
      return
    }

    const dados = {
      pago: true,
      pago_em: new Date(`${data}T12:00:00`).toISOString(),
      // Só envia a coluna quando preenchida: assim marcar como pago
      // continua funcionando antes da migração.
      ...(pagoPor.trim() && { pago_por: pagoPor.trim() }),
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
          <label htmlFor="pagamento-quem">Quem pagou <span className="muted">(opcional)</span></label>
          <input
            id="pagamento-quem"
            type="text"
            list="pagadores-conhecidos"
            placeholder="Ex.: Ana, pais da noiva…"
            maxLength={120}
            value={pagoPor}
            onChange={(e) => setPagoPor(e.target.value)}
            autoFocus
          />
          <datalist id="pagadores-conhecidos">
            {pagadores.map((nome) => <option key={nome} value={nome} />)}
          </datalist>
        </div>
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
