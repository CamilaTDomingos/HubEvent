import { somarMeses } from './datas'

// Divide um valor em `n` partes em centavos; a última absorve a sobra
// do arredondamento para que a soma bata exatamente com o total.
export function dividir(total, n) {
  const centavos = Math.round(total * 100)
  const base = Math.floor(centavos / n)
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? centavos - base * (n - 1) : base) / 100)
}

// Monta as linhas da tabela parcela de uma despesa nova.
// À vista: um pagamento só. Parcelado: entrada opcional + o restante em parcelas.
export function montarPagamentos({ valor, parcelar, comEntrada, valorEntrada, dataEntrada, numParcelas, vencimento }) {
  // `entrada` sempre explícito: num insert em lote, chave ausente vira null e quebra o NOT NULL.
  if (!parcelar) return [{ numero: 1, valor, vencimento, entrada: false }]

  const pagamentos = []
  let restante = valor
  if (comEntrada) {
    pagamentos.push({ numero: 1, valor: valorEntrada, vencimento: dataEntrada, entrada: true })
    restante = Math.round((valor - valorEntrada) * 100) / 100
  }
  dividir(restante, numParcelas).forEach((v, i) => {
    pagamentos.push({ numero: pagamentos.length + 1, valor: v, vencimento: somarMeses(vencimento, i), entrada: false })
  })
  return pagamentos
}

// Totais de pagamento de todas as despesas do evento.
export function resumoPagamentos(despesas) {
  const parcelas = despesas.flatMap((d) => d.parcela ?? [])
  const pagas = parcelas.filter((p) => p.pago)
  const pendentes = parcelas.filter((p) => !p.pago)

  const total = despesas.reduce((soma, d) => soma + Number(d.valor_total), 0)
  const pago = pagas.reduce((soma, p) => soma + Number(p.valor), 0)

  const porPagador = {}
  pagas.forEach((p) => {
    const nome = p.pago_por?.trim() || 'Não informado'
    porPagador[nome] = (porPagador[nome] ?? 0) + Number(p.valor)
  })

  const proxima = pendentes.reduce((menor, p) => (!menor || p.vencimento < menor.vencimento ? p : menor), null)

  return {
    pago,
    falta: Math.max(total - pago, 0),
    percentual: total > 0 ? Math.min((pago / total) * 100, 100) : 0,
    porPagador: Object.entries(porPagador).sort((a, b) => b[1] - a[1]),
    proxima,
  }
}

// Nomes já usados em "quem pagou", para sugerir no modal.
export function pagadoresConhecidos(despesas) {
  const nomes = despesas.flatMap((d) => (d.parcela ?? []).map((p) => p.pago_por?.trim()).filter(Boolean))
  return [...new Set(nomes)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
