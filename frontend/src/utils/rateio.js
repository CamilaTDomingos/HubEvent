// Cálculos do rateio (RF03). Tudo em centavos inteiros: em reais,
// 0,1 + 0,2 dá 0,30000000000000004 e a divisão deixaria de fechar.

export const DIVISOES = {
  IGUAL: 'Igual',
  VALOR: 'Valores',
  PERCENTUAL: 'Porcentagens',
}

export function paraCentavos(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0
}

export function paraReais(centavos) {
  return centavos / 100
}

// Divide `total` em partes inteiras entre `ids`. Os centavos que sobram
// vão um para cada, na ordem da lista (100 entre 3 = 34 + 33 + 33).
export function dividirIgual(total, ids) {
  const partes = {}
  if (!ids.length) return partes
  const base = Math.floor(total / ids.length)
  const sobra = total - base * ids.length
  ids.forEach((id, i) => {
    partes[id] = base + (i < sobra ? 1 : 0)
  })
  return partes
}

// Converte porcentagens (com até duas casas) em centavos que fecham com o
// total: cada um recebe a parte inteira e os centavos que faltam vão para
// as maiores frações (método do maior resto). A conta é feita em
// centésimos de porcento para não depender de ponto flutuante.
export function percentuaisParaCentavos(total, percentuais) {
  const linhas = Object.entries(percentuais).map(([id, p], ordem) => {
    const pontos = Math.round(Number(p) * 100)
    return { id, ordem, base: Math.floor((total * pontos) / 10000), resto: (total * pontos) % 10000 }
  })
  let faltam = total - linhas.reduce((soma, l) => soma + l.base, 0)
  const partes = Object.fromEntries(linhas.map((l) => [l.id, l.base]))
  const porResto = [...linhas].sort((a, b) => b.resto - a.resto || a.ordem - b.ordem)
  for (let i = 0; faltam > 0 && porResto.length; i = (i + 1) % porResto.length, faltam--) {
    partes[porResto[i].id] += 1
  }
  return partes
}

// Confere uma divisão personalizada antes de salvar.
// `entradas`: { participanteId: texto digitado }.
export function conferirDivisao(modo, total, entradas) {
  const valores = Object.values(entradas)
  if (modo === 'VALOR') {
    const soma = valores.reduce((s, v) => s + paraCentavos(v || 0), 0)
    const negativo = valores.some((v) => Number(v) < 0)
    return { soma, alvo: total, diferenca: total - soma, ok: soma === total && !negativo, negativo }
  }
  if (modo === 'PERCENTUAL') {
    const soma = valores.reduce((s, v) => s + Math.round(Number(v || 0) * 100), 0)
    const negativo = valores.some((v) => Number(v) < 0)
    return { soma, alvo: 10000, diferenca: 10000 - soma, ok: soma === 10000 && !negativo, negativo }
  }
  return { soma: total, alvo: total, diferenca: 0, ok: true, negativo: false }
}

// Parte de cada participante numa despesa, em centavos.
// IGUAL (ou personalizada sem cotas gravadas) divide entre quem participa agora.
export function partesDaDespesa(despesa, participantes, cotasDaDespesa = []) {
  const total = paraCentavos(despesa.valor_total)
  if (despesa.divisao && despesa.divisao !== 'IGUAL' && cotasDaDespesa.length) {
    return Object.fromEntries(cotasDaDespesa.map((c) => [c.participante_id, paraCentavos(c.valor)]))
  }
  return dividirIgual(total, participantes.map((p) => p.id))
}

// Quem pagou a despesa: sem pago_por_id, é o organizador.
export function pagadorDaDespesa(despesa, participantes) {
  const organizador = participantes.find((p) => p.organizador) ?? participantes[0]
  return participantes.find((p) => p.id === despesa.pago_por_id) ?? organizador ?? null
}

// Saldo de cada participante: pagou − parte + acertos que fez − acertos que recebeu.
// Positivo: tem a receber. Negativo: tem a pagar.
export function calcularRateio({ despesas, participantes, cotas = [], pagamentos = [] }) {
  const pessoas = new Map(participantes.map((p) => [p.id, { participante: p, pagou: 0, parte: 0, enviou: 0, recebeu: 0 }]))
  const cotasPorDespesa = cotas.reduce((mapa, c) => mapa.set(c.despesa_id, [...(mapa.get(c.despesa_id) ?? []), c]), new Map())

  for (const d of despesas) {
    const pagador = pagadorDaDespesa(d, participantes)
    if (pagador) pessoas.get(pagador.id).pagou += paraCentavos(d.valor_total)
    const partes = partesDaDespesa(d, participantes, cotasPorDespesa.get(d.id))
    for (const [id, valor] of Object.entries(partes)) {
      if (pessoas.has(id)) pessoas.get(id).parte += valor
    }
  }

  for (const pg of pagamentos) {
    const valor = paraCentavos(pg.valor)
    if (pessoas.has(pg.de_id)) pessoas.get(pg.de_id).enviou += valor
    if (pessoas.has(pg.para_id)) pessoas.get(pg.para_id).recebeu += valor
  }

  const lista = [...pessoas.values()].map((p) => ({ ...p, saldo: p.pagou - p.parte + p.enviou - p.recebeu }))
  return { pessoas: lista, acertos: simplificarAcertos(lista.map((p) => ({ id: p.participante.id, saldo: p.saldo }))) }
}

// Lista simplificada de acertos: o maior devedor paga o maior credor até
// zerar um dos dois. São no máximo n − 1 transferências; costuma ser o
// mínimo, mas não há garantia (achar o mínimo exato é um problema NP-difícil).
export function simplificarAcertos(saldos) {
  const ordem = new Map(saldos.map((s, i) => [s.id, i]))
  const desempate = (a, b) => ordem.get(a.id) - ordem.get(b.id)
  const credores = saldos.filter((s) => s.saldo > 0).map((s) => ({ ...s })).sort((a, b) => b.saldo - a.saldo || desempate(a, b))
  const devedores = saldos.filter((s) => s.saldo < 0).map((s) => ({ ...s, saldo: -s.saldo })).sort((a, b) => b.saldo - a.saldo || desempate(a, b))

  const acertos = []
  let c = 0
  let d = 0
  while (c < credores.length && d < devedores.length) {
    const valor = Math.min(credores[c].saldo, devedores[d].saldo)
    acertos.push({ de: devedores[d].id, para: credores[c].id, valor })
    credores[c].saldo -= valor
    devedores[d].saldo -= valor
    if (credores[c].saldo === 0) c++
    if (devedores[d].saldo === 0) d++
  }
  return acertos
}

// Um participante só sai do rateio se não pagou nada, não tem parte
// personalizada e não aparece em nenhum acerto. Nas despesas divididas
// igualmente ele some e os outros passam a dividir.
export function motivoParaNaoRemover(participante, { despesas, cotas, pagamentos }) {
  if (participante.organizador) return 'O organizador sempre participa do rateio.'
  if (despesas.some((d) => d.pago_por_id === participante.id)) return `${participante.nome} pagou alguma despesa. Troque quem pagou antes de remover.`
  if (cotas.some((c) => c.participante_id === participante.id)) return `${participante.nome} tem parte numa divisão personalizada. Ajuste a divisão antes de remover.`
  if (pagamentos.some((p) => p.de_id === participante.id || p.para_id === participante.id)) return `${participante.nome} tem acertos registrados. Desfaça os acertos antes de remover.`
  return null
}
