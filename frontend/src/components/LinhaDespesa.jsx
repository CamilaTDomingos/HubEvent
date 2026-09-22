import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useParcelas } from '../hooks/useParcelas'

function LinhaDespesa({ despesa, aoExcluir }) {
  const [expandido, setExpandido] = useState(false)
  const { parcelas, carregando, recarregar } = useParcelas(expandido ? despesa.id : null)

  const temParcelas = despesa.parcelado

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
    <>
      <tr>
        <td>{despesa.descricao}</td>
        <td>{despesa.categoria || '—'}</td>
        <td>R$ {Number(despesa.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>
          {temParcelas ? (
            <button
              onClick={() => setExpandido(!expandido)}
              style={{ background: 'none', border: 'none', color: 'var(--em)', cursor: 'pointer', fontSize: 12 }}
            >
              {expandido ? 'Ocultar parcelas' : 'Ver parcelas'}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>À vista</span>
          )}
        </td>
        <td>
          <button
            onClick={() => aoExcluir(despesa.id)}
            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12 }}
          >
            Excluir
          </button>
        </td>
      </tr>

      {expandido && (
        <tr>
          <td colSpan={5} style={{ background: 'var(--bg-2)', padding: '12px 16px' }}>
            {carregando ? (
              <p style={{ fontSize: 12 }}>Carregando parcelas...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {parcelas.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={p.pago}
                      onChange={() => togglePago(p)}
                      style={{ accentColor: 'var(--em)' }}
                    />
                    <span>Parcela {p.numero}</span>
                    <span>R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span style={{ color: 'var(--text-3)' }}>
                      Vencimento: {new Date(p.vencimento).toLocaleDateString('pt-BR')}
                    </span>
                    {p.pago && <span className="badge badge-ok">Pago</span>}
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default LinhaDespesa