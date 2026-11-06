import { useCallback, useEffect, useRef, useState } from 'react'
import { useParcelasEvento } from '../hooks/useParcelasEvento'
import { moeda, paraData } from '../utils/datas'

const ALTURA = 220
const MARGEM = { topo: 22, direita: 18, base: 30, esquerda: 64 }

const chaveMes = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
const dataDaChave = (chave) => new Date(`${chave}-01T00:00:00`)
const mesCurto = (chave) => dataDaChave(chave).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
const mesExtenso = (chave) => dataDaChave(chave).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
const moedaCompacta = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })

// Passo "redondo" (1, 2, 2.5, 5 × 10^n) para as linhas de grade do eixo Y.
function passoRedondo(maximo, linhas = 4) {
  const bruto = maximo / linhas
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const fator = [1, 2, 2.5, 5, 10].find((f) => f * potencia >= bruto)
  return fator * potencia
}

// Agrupa as saídas por mês: parcelas pelo vencimento; despesas à vista pela
// data do pagamento. Sem data (parcelada cujas parcelas não foram gravadas),
// cai no dia do lançamento para o valor não sumir do gráfico.
function montarMeses(despesas, parcelas) {
  const comParcelas = new Set(parcelas.map((p) => p.despesa_id))
  const porMes = {}
  const somar = (data, valor, tipo) => {
    const chave = chaveMes(data)
    porMes[chave] ??= { valor: 0, parcelas: 0, aVista: 0 }
    porMes[chave].valor += Number(valor)
    porMes[chave][tipo] += 1
  }

  parcelas.forEach((p) => somar(paraData(p.vencimento), p.valor, 'parcelas'))
  despesas
    .filter((d) => !comParcelas.has(d.id))
    .forEach((d) => somar(paraData(d.vencimento ?? d.criado_em), d.valor_total, 'aVista'))

  const chaves = Object.keys(porMes).sort()
  if (!chaves.length) return []

  // Preenche os meses sem saída para a linha não pular intervalos.
  const meses = []
  const atual = dataDaChave(chaves[0])
  const fim = dataDaChave(chaves[chaves.length - 1])
  while (atual <= fim) {
    const chave = chaveMes(atual)
    meses.push({ chave, ...(porMes[chave] ?? { valor: 0, parcelas: 0, aVista: 0 }) })
    atual.setMonth(atual.getMonth() + 1)
  }

  let acumulado = 0
  return meses.map((m) => ({ ...m, acumulado: (acumulado += m.valor) }))
}

function GraficoFluxoCaixa({ eventoId, despesas, orcamento, dataEvento }) {
  const { parcelas, carregando } = useParcelasEvento(eventoId, despesas)
  const [modo, setModo] = useState('mensal')
  const [ativo, setAtivo] = useState(null)
  const [largura, setLargura] = useState(0)
  const observador = useRef(null)

  // Ref de callback: a área do gráfico só existe depois que há dados, então
  // o observador precisa ser ligado quando o elemento aparece, não no mount.
  const caixaRef = useCallback((el) => {
    observador.current?.disconnect()
    if (!el) return
    observador.current = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width))
    observador.current.observe(el)
  }, [])

  const meses = montarMeses(despesas, parcelas)
  const campo = modo === 'mensal' ? 'valor' : 'acumulado'
  const mostrarOrcamento = modo === 'acumulado' && orcamento > 0

  // Ao trocar de modo ou mudar os dados, some com o tooltip antigo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAtivo(null)
  }, [modo, meses.length])

  const cabecalho = (
    <div className="painel-cab fluxo-cab">
      <h3 className="titulo">Fluxo de caixa</h3>
      <div className="fluxo-modos" role="group" aria-label="Visualização">
        {[['mensal', 'Por mês'], ['acumulado', 'Acumulado']].map(([valor, rotulo]) => (
          <button key={valor} type="button" className={modo === valor ? 'sel' : ''} aria-pressed={modo === valor} onClick={() => setModo(valor)}>
            {rotulo}
          </button>
        ))}
      </div>
    </div>
  )

  if (!meses.length) {
    return (
      <section className="painel fluxo">
        {cabecalho}
        <p className="muted painel-vazio">
          {carregando && despesas.length ? 'Carregando…' : 'As saídas de cada mês aparecem aqui conforme você lança despesas e parcelas.'}
        </p>
      </section>
    )
  }

  const valores = meses.map((m) => m[campo])
  const topo = Math.max(...valores, mostrarOrcamento ? orcamento : 0) || 1
  const passo = passoRedondo(topo)
  const yMax = Math.ceil(topo / passo) * passo
  const marcasY = Array.from({ length: Math.round(yMax / passo) + 1 }, (_, i) => i * passo)

  const larguraUtil = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 0)
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base
  const x = (i) => MARGEM.esquerda + (meses.length === 1 ? larguraUtil / 2 : (i / (meses.length - 1)) * larguraUtil)
  const y = (v) => MARGEM.topo + alturaUtil - (v / yMax) * alturaUtil

  const pontos = meses.map((m, i) => [x(i), y(m[campo])])
  const linha = pontos.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join(' ')
  const area = `${linha} L${pontos[pontos.length - 1][0]},${y(0)} L${pontos[0][0]},${y(0)} Z`

  // Rótulos do eixo X: pula meses quando não cabem; mostra o ano na virada.
  const intervaloX = Math.max(1, Math.ceil(46 / (larguraUtil / Math.max(meses.length - 1, 1))))
  const rotuloX = (chave, i) => {
    const [ano, mes] = chave.split('-')
    return i === 0 || mes === '01' ? `${mesCurto(chave)} ${ano.slice(2)}` : mesCurto(chave)
  }

  const hoje = meses.findIndex((m) => m.chave === chaveMes(new Date()))
  const evento = dataEvento ? meses.findIndex((m) => m.chave === chaveMes(paraData(dataEvento))) : -1

  // Rótulo direto só no ponto que importa: o mês mais pesado, ou o total no fim.
  const destaque = modo === 'mensal' ? valores.indexOf(Math.max(...valores)) : meses.length - 1

  // Acima do ponto, a não ser que ali já esteja o texto de "hoje"/"evento":
  // aí vai para o lado (para dentro do gráfico, perto das bordas).
  const [dx, dy] = pontos[destaque]
  const perto = (destaque === hoje || destaque === evento) && dy - 12 < MARGEM.topo + 4
  const aDireita = dx < largura - MARGEM.direita - 70
  const posicaoRotulo = perto
    ? { x: aDireita ? dx + 9 : dx - 9, y: dy + 4, textAnchor: aDireita ? 'start' : 'end' }
    : { x: Math.min(Math.max(dx, MARGEM.esquerda + 30), largura - MARGEM.direita - 30), y: Math.max(dy - 12, 12), textAnchor: 'middle' }

  function aoMover(e) {
    const caixa = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - caixa.left
    const i = meses.length === 1 ? 0 : Math.round(((px - MARGEM.esquerda) / larguraUtil) * (meses.length - 1))
    setAtivo(Math.min(Math.max(i, 0), meses.length - 1))
  }

  function aoTeclar(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const delta = e.key === 'ArrowRight' ? 1 : -1
    setAtivo((atual) => Math.min(Math.max((atual ?? (delta > 0 ? -1 : meses.length)) + delta, 0), meses.length - 1))
  }

  const mesAtivo = ativo !== null ? meses[ativo] : null

  return (
    <section className="painel fluxo">
      {cabecalho}
      <div className="fluxo-corpo">
        <div className="fluxo-grafico" ref={caixaRef}>
          {largura > 0 && (
            <svg
              width={largura}
              height={ALTURA}
              tabIndex={0}
              aria-label="Gráfico de linha das saídas por mês. Use as setas para percorrer os meses."
              onMouseMove={aoMover}
              onMouseLeave={() => setAtivo(null)}
              onKeyDown={aoTeclar}
              onBlur={() => setAtivo(null)}
            >
              {marcasY.map((v) => (
                <g key={v}>
                  <line className="fluxo-grade" x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(v)} y2={y(v)} />
                  <text className="fluxo-eixo" x={MARGEM.esquerda - 10} y={y(v)} dy="0.32em" textAnchor="end">{moedaCompacta(v)}</text>
                </g>
              ))}

              {meses.map((m, i) => (i % intervaloX === 0 || i === meses.length - 1) && (i === meses.length - 1 || meses.length - 1 - i >= intervaloX) && (
                <text key={m.chave} className="fluxo-eixo" x={x(i)} y={ALTURA - 8} textAnchor="middle">{rotuloX(m.chave, i)}</text>
              ))}

              {evento >= 0 && (
                <g className="fluxo-marco evento">
                  <line x1={x(evento)} x2={x(evento)} y1={MARGEM.topo - 6} y2={y(0)} />
                  <text x={x(evento)} y={MARGEM.topo - 10} textAnchor="middle">evento</text>
                </g>
              )}
              {hoje >= 0 && hoje !== evento && (
                <g className="fluxo-marco">
                  <line x1={x(hoje)} x2={x(hoje)} y1={MARGEM.topo - 6} y2={y(0)} />
                  <text x={x(hoje)} y={MARGEM.topo - 10} textAnchor="middle">hoje</text>
                </g>
              )}

              {mostrarOrcamento && (
                <g className="fluxo-orcamento">
                  <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(orcamento)} y2={y(orcamento)} />
                  <text x={MARGEM.esquerda + 6} y={y(orcamento) - 6}>orçamento {moedaCompacta(orcamento)}</text>
                </g>
              )}

              <path key={`a-${modo}`} className="fluxo-area" d={area} />
              <path key={`l-${modo}`} className="fluxo-linha" d={linha} pathLength="1" />

              {mesAtivo && (
                <line className="fluxo-mira" x1={x(ativo)} x2={x(ativo)} y1={MARGEM.topo} y2={y(0)} />
              )}

              {pontos.map(([px, py], i) => (
                <circle key={meses[i].chave} className={`fluxo-ponto ${ativo === i ? 'ativo' : ''}`} cx={px} cy={py} r={ativo === i ? 5.5 : 4} />
              ))}

              {ativo !== destaque && (
                <text className="fluxo-rotulo" {...posicaoRotulo}>
                  {moedaCompacta(valores[destaque])}
                </text>
              )}
            </svg>
          )}

          {mesAtivo && (
            <div
              className="fluxo-dica"
              style={{
                left: Math.min(Math.max(x(ativo), 90), largura - 90),
                top: Math.max(y(mesAtivo[campo]) - 14, 0),
              }}
            >
              <span className="fluxo-dica-mes">{mesExtenso(mesAtivo.chave)}</span>
              <strong className="num">{moeda(mesAtivo[campo])}</strong>
              {modo === 'mensal' ? (
                <span>
                  {[
                    mesAtivo.parcelas && `${mesAtivo.parcelas} ${mesAtivo.parcelas === 1 ? 'parcela' : 'parcelas'}`,
                    mesAtivo.aVista && `${mesAtivo.aVista} à vista`,
                  ].filter(Boolean).join(' · ') || 'sem saídas'}
                </span>
              ) : (
                <span>{orcamento > 0 ? `${((mesAtivo.acumulado / orcamento) * 100).toFixed(0)}% do orçamento` : `${moeda(mesAtivo.valor)} no mês`}</span>
              )}
            </div>
          )}
        </div>

        <p className="fluxo-nota muted">Parcelas entram no mês do vencimento; despesas à vista, no mês do pagamento.</p>
      </div>

      <table className="sr-only">
        <caption>Fluxo de caixa por mês</caption>
        <thead>
          <tr><th scope="col">Mês</th><th scope="col">Saídas no mês</th><th scope="col">Acumulado</th></tr>
        </thead>
        <tbody>
          {meses.map((m) => (
            <tr key={m.chave}><th scope="row">{mesExtenso(m.chave)}</th><td>{moeda(m.valor)}</td><td>{moeda(m.acumulado)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default GraficoFluxoCaixa
