import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useParcelas } from '../hooks/useParcelas'
import { corDespesa } from '../utils/categorias'
import { moeda, dataMedia } from '../utils/datas'

function LinhaDespesa({ despesa, indice = 0, aoExcluir }) {
  const [expandido, setExpandido] = useState(false)
  const { parcelas, carregando, recarregar } = useParcelas(expandido ? despesa.id : null)

  const temParcelas = despesa.parcelado
  const pagas = parcelas.filter((p) => p.pago).length

  async function togglePago(parcela) {
    const { error } = await supabase
      .from('parcela')
      .update({
        pago: !parcela.pago,
        pago_em: !parcela.pago ? new Date().toISOString() : null,
      })
      .eq('id', parcela.id)

    if (!error) recarregar()
  }

  return (
    <li className="desp" style={{ '--i': indice }}>
      <div className="desp-linha">
        <span className="desp-cor" style={{ background: corDespesa(despesa.categoria) }} aria-hidden="true" />
        <div className="desp-desc">
          <strong>{despesa.descricao}</strong>
          <span className="mono muted">{despesa.categoria || 'Sem categoria'}</span>
        </div>
        <div className="desp-forma">
          {temParcelas ? (
            <button className="link mono" aria-expanded={expandido} onClick={() => setExpandido(!expandido)}>
              {expandido ? 'ocultar parcelas ↑' : 'parcelado ↓'}
            </button>
          ) : (
            <span className="mono muted">à vista</span>
          )}
        </div>
        <span className="desp-valor num">{moeda(despesa.valor_total)}</span>
        <button className="link mono link-danger desp-excluir" onClick={() => aoExcluir(despesa.id)}>
          excluir
        </button>
      </div>

      {expandido && (
        <div className="parcelas">
          {carregando && parcelas.length === 0 ? (
            <p className="mono muted">Carregando parcelas…</p>
          ) : (
            <>
              <div className="parcelas-progresso">
                <span className="mono">{pagas} de {parcelas.length} pagas</span>
                <span className="parcelas-barra">
                  <span style={{ width: `${parcelas.length ? (pagas / parcelas.length) * 100 : 0}%` }} />
                </span>
              </div>
              <div className="parcelas-lista">
                {parcelas.map((p) => (
                  <label key={p.id} className={`parcela ${p.pago ? 'paga' : ''}`}>
                    <input type="checkbox" checked={p.pago} onChange={() => togglePago(p)} />
                    <span className="parcela-check" aria-hidden="true">{p.pago ? '✓' : p.numero}</span>
                    <span className="parcela-info">
                      <strong className="num">{moeda(p.valor)}</strong>
                      <span className="mono">vence {dataMedia(p.vencimento)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}

export default LinhaDespesa
