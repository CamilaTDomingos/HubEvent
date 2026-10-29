import { useState } from 'react'
import { COR_SEM_CATEGORIA } from '../utils/categorias'
import { moeda, dataMedia, diasAte } from '../utils/datas'
import Icone from './Icone'

const TEXTO_DIVISAO = { VALOR: 'valores próprios', PERCENTUAL: 'por porcentagem' }

function formaDePagamento(parcelas) {
  const temEntrada = parcelas.some((p) => p.entrada)
  const qtd = parcelas.filter((p) => !p.entrada).length
  if (temEntrada) return `Entrada + ${qtd}×`
  if (qtd > 1) return `${qtd}× parcelado`
  return 'À vista'
}

// `pagador` e `aoDividir` só chegam quando o evento tem rateio (mais de um participante).
function LinhaDespesa({ despesa, indice = 0, aoExcluir, aoPagar, aoDesfazer, pagador, aoDividir }) {
  const [expandido, setExpandido] = useState(false)

  const parcelas = despesa.parcela ?? []
  const pagas = parcelas.filter((p) => p.pago)
  const valorPago = pagas.reduce((soma, p) => soma + Number(p.valor), 0)
  const falta = Math.max(Number(despesa.valor_total) - valorPago, 0)
  const quitada = parcelas.length > 0 && pagas.length === parcelas.length
  const temEntrada = parcelas.some((p) => p.entrada)

  return (
    <li className="desp" style={{ '--i': indice }}>
      <div className="desp-linha">
        <span className="desp-cor" style={{ background: despesa.cor || COR_SEM_CATEGORIA }} aria-hidden="true" />
        <div className="desp-desc">
          <strong>{despesa.descricao}</strong>
          <span>
            {despesa.categoria || 'Sem categoria'}
            {pagador && ` · pago por ${pagador}`}
            {pagador && TEXTO_DIVISAO[despesa.divisao] && `, dividida em ${TEXTO_DIVISAO[despesa.divisao]}`}
          </span>
        </div>
        <div className="desp-forma">
          <button className={`desp-parcelado ${expandido ? 'aberto' : ''}`} aria-expanded={expandido} onClick={() => setExpandido(!expandido)}>
            {formaDePagamento(parcelas)} <Icone nome="chevron" tamanho={14} />
          </button>
        </div>
        <div className="desp-valor">
          <span className="num">{moeda(despesa.valor_total)}</span>
          <span className={`desp-status ${quitada ? 'ok' : ''}`}>
            {quitada ? 'Pago' : valorPago > 0 ? `Faltam ${moeda(falta)}` : 'A pagar'}
          </span>
        </div>
        <span className="desp-acoes">
          {aoDividir && (
            <button className="btn-icone desp-acao" onClick={() => aoDividir(despesa)} title="Quem pagou e divisão" aria-label={`Dividir ${despesa.descricao}`}>
              <Icone nome="usuarios" tamanho={16} />
            </button>
          )}
          <button className="btn-icone perigo desp-acao" onClick={() => aoExcluir(despesa.id)} title="Excluir" aria-label={`Excluir ${despesa.descricao}`}>
            <Icone nome="lixeira" tamanho={16} />
          </button>
        </span>
      </div>

      {expandido && (
        <div className="parcelas">
          {parcelas.length > 1 && (
            <div className="parcelas-progresso">
              <span>{pagas.length} de {parcelas.length} pagamentos feitos</span>
              <span className="parcelas-barra">
                <span style={{ width: `${(pagas.length / parcelas.length) * 100}%` }} />
              </span>
            </div>
          )}
          <div className="parcelas-lista">
            {parcelas.length === 0 ? (
              <button className="parcela" onClick={() => aoPagar(despesa, null)}>
                <span className="parcela-check" aria-hidden="true">1</span>
                <span className="parcela-info">
                  <strong className="num">{moeda(despesa.valor_total)}</strong>
                  <span>Marcar como pago</span>
                </span>
              </button>
            ) : (
              parcelas.map((p) => {
                const atrasada = !p.pago && diasAte(p.vencimento) < 0
                const numero = temEntrada ? p.numero - 1 : p.numero
                return (
                  <button
                    key={p.id}
                    className={`parcela ${p.pago ? 'paga' : ''} ${atrasada ? 'atrasada' : ''}`}
                    aria-pressed={p.pago}
                    title={p.pago ? 'Desmarcar pagamento' : 'Registrar pagamento'}
                    onClick={() => (p.pago ? aoDesfazer(p) : aoPagar(despesa, p))}
                  >
                    <span className="parcela-check" aria-hidden="true">
                      {p.pago ? <Icone nome="check" tamanho={13} traco={2.2} /> : p.entrada ? 'E' : numero}
                    </span>
                    <span className="parcela-info">
                      <strong className="num">{moeda(p.valor)}{p.entrada && <em> · entrada</em>}</strong>
                      <span>
                        {p.pago
                          ? `Pago${p.pago_por ? ` por ${p.pago_por}` : ''}${p.pago_em ? ` · ${dataMedia(p.pago_em)}` : ''}`
                          : `${atrasada ? 'Venceu' : 'Vence'} ${dataMedia(p.vencimento)}`}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export default LinhaDespesa
