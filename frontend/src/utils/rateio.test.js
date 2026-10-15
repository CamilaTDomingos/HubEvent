// Testes dos cálculos do rateio. Rodar com: npm test (usa o node:test, sem dependência).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  dividirIgual,
  percentuaisParaCentavos,
  conferirDivisao,
  calcularRateio,
  simplificarAcertos,
  motivoParaNaoRemover,
} from './rateio.js'

const amanda = { id: 'a', nome: 'Amanda', organizador: true }
const bruno = { id: 'b', nome: 'Bruno', organizador: false }
const carla = { id: 'c', nome: 'Carla', organizador: false }
const participantes = [amanda, bruno, carla]

const somar = (partes) => Object.values(partes).reduce((s, v) => s + v, 0)
const saldos = (rateio) => Object.fromEntries(rateio.pessoas.map((p) => [p.participante.id, p.saldo]))

test('divisão igual com centavos: 100,00 entre 3 fecha em 33,34 + 33,33 + 33,33', () => {
  const partes = dividirIgual(10000, ['a', 'b', 'c'])
  assert.deepEqual(partes, { a: 3334, b: 3333, c: 3333 })
  assert.equal(somar(partes), 10000)
})

test('divisão igual sempre fecha com o total', () => {
  for (let total = 0; total <= 1000; total++) {
    for (let n = 1; n <= 7; n++) {
      const partes = dividirIgual(total, Array.from({ length: n }, (_, i) => `p${i}`))
      assert.equal(somar(partes), total)
      assert.ok(Math.max(...Object.values(partes)) - Math.min(...Object.values(partes)) <= 1)
    }
  }
})

test('porcentagens viram centavos que fecham com o total', () => {
  assert.deepEqual(percentuaisParaCentavos(10000, { a: 33.33, b: 33.33, c: 33.34 }), { a: 3333, b: 3333, c: 3334 })
  // 10,00 em 3 partes iguais de porcentagem: o centavo que sobra vai para a maior fração
  const partes = percentuaisParaCentavos(1001, { a: 50, b: 25, c: 25 })
  assert.equal(somar(partes), 1001)
  assert.deepEqual(partes, { a: 501, b: 250, c: 250 })
  for (const total of [1, 7, 99, 12345, 99999999]) {
    assert.equal(somar(percentuaisParaCentavos(total, { a: 12.5, b: 37.49, c: 50.01 })), total)
  }
})

test('divisão por valores que não fecha é recusada e mostra a diferença', () => {
  const r = conferirDivisao('VALOR', 10000, { a: '50', b: '49.99', c: '' })
  assert.equal(r.ok, false)
  assert.equal(r.diferenca, 1)
  const passou = conferirDivisao('VALOR', 10000, { a: '60', b: '50' })
  assert.equal(passou.ok, false)
  assert.equal(passou.diferenca, -1000)
  assert.equal(conferirDivisao('VALOR', 10000, { a: '0.1', b: '0.2', c: '99.7' }).ok, true)
  assert.equal(conferirDivisao('VALOR', 10000, { a: '150', b: '-50' }).ok, false)
})

test('porcentagens que não somam 100 são recusadas', () => {
  assert.equal(conferirDivisao('PERCENTUAL', 10000, { a: '33.33', b: '33.33', c: '33.33' }).ok, false)
  assert.equal(conferirDivisao('PERCENTUAL', 10000, { a: '33.33', b: '33.33', c: '33.34' }).ok, true)
  assert.equal(conferirDivisao('PERCENTUAL', 10000, { a: '120', b: '-20' }).ok, false)
})

test('rateio igual: quem pagou recebe dos outros', () => {
  const despesas = [{ id: 'd1', valor_total: '300.00', pago_por_id: 'a', divisao: 'IGUAL' }]
  const r = calcularRateio({ despesas, participantes })
  assert.deepEqual(saldos(r), { a: 20000, b: -10000, c: -10000 })
  assert.deepEqual(r.acertos, [
    { de: 'b', para: 'a', valor: 10000 },
    { de: 'c', para: 'a', valor: 10000 },
  ])
})

test('despesa sem pago_por_id conta como paga pelo organizador', () => {
  const r = calcularRateio({ despesas: [{ id: 'd1', valor_total: 90, pago_por_id: null, divisao: 'IGUAL' }], participantes })
  assert.equal(saldos(r).a, 6000)
})

test('divisão personalizada usa as cotas gravadas', () => {
  const despesas = [{ id: 'd1', valor_total: 100, pago_por_id: 'b', divisao: 'VALOR' }]
  const cotas = [
    { despesa_id: 'd1', participante_id: 'a', valor: '70.00' },
    { despesa_id: 'd1', participante_id: 'c', valor: '30.00' },
  ]
  const r = calcularRateio({ despesas, participantes, cotas })
  assert.deepEqual(saldos(r), { a: -7000, b: 10000, c: -3000 })
})

test('saldos sempre somam zero, inclusive com centavos', () => {
  const despesas = [
    { id: 'd1', valor_total: 100, pago_por_id: 'a', divisao: 'IGUAL' },
    { id: 'd2', valor_total: 0.01, pago_por_id: 'b', divisao: 'IGUAL' },
    { id: 'd3', valor_total: 57.77, pago_por_id: 'c', divisao: 'IGUAL' },
  ]
  const r = calcularRateio({ despesas, participantes })
  assert.equal(r.pessoas.reduce((s, p) => s + p.saldo, 0), 0)
})

test('acertos zeram todos os saldos com no máximo n − 1 transferências', () => {
  const casos = [
    [{ id: 'a', saldo: 5000 }, { id: 'b', saldo: -2000 }, { id: 'c', saldo: -3000 }],
    [{ id: 'a', saldo: 1 }, { id: 'b', saldo: 1 }, { id: 'c', saldo: -1 }, { id: 'd', saldo: -1 }],
    [{ id: 'a', saldo: 4000 }, { id: 'b', saldo: -1000 }, { id: 'c', saldo: -1000 }, { id: 'd', saldo: 0 }, { id: 'e', saldo: -2000 }],
  ]
  for (const saldosIniciais of casos) {
    const acertos = simplificarAcertos(saldosIniciais)
    const finais = Object.fromEntries(saldosIniciais.map((s) => [s.id, s.saldo]))
    for (const { de, para, valor } of acertos) {
      assert.ok(valor > 0)
      finais[de] += valor
      finais[para] -= valor
    }
    assert.ok(Object.values(finais).every((v) => v === 0))
    assert.ok(acertos.length <= saldosIniciais.filter((s) => s.saldo !== 0).length - 1)
  }
})

test('dois pares independentes geram só duas transferências', () => {
  const acertos = simplificarAcertos([{ id: 'a', saldo: 5000 }, { id: 'b', saldo: -5000 }, { id: 'c', saldo: 2000 }, { id: 'd', saldo: -2000 }])
  assert.deepEqual(acertos, [
    { de: 'b', para: 'a', valor: 5000 },
    { de: 'd', para: 'c', valor: 2000 },
  ])
})

test('acerto quitado entra no saldo e some da lista', () => {
  const despesas = [{ id: 'd1', valor_total: 300, pago_por_id: 'a', divisao: 'IGUAL' }]
  const pagamentos = [{ de_id: 'b', para_id: 'a', valor: '100.00' }]
  const r = calcularRateio({ despesas, participantes, pagamentos })
  assert.deepEqual(saldos(r), { a: 10000, b: 0, c: -10000 })
  assert.deepEqual(r.acertos, [{ de: 'c', para: 'a', valor: 10000 }])
})

test('despesa apagada sai da conta; acerto já feito vira crédito de volta', () => {
  const pagamentos = [{ de_id: 'b', para_id: 'a', valor: 100 }]
  const antes = calcularRateio({ despesas: [{ id: 'd1', valor_total: 300, pago_por_id: 'a' }, { id: 'd2', valor_total: 60, pago_por_id: 'c' }], participantes, pagamentos })
  assert.deepEqual(saldos(antes), { a: 8000, b: -2000, c: -6000 })
  // d1 foi apagada (as cotas dela somem junto, pelo cascade)
  const depois = calcularRateio({ despesas: [{ id: 'd2', valor_total: 60, pago_por_id: 'c' }], participantes, pagamentos, cotas: [] })
  assert.deepEqual(saldos(depois), { a: -12000, b: 8000, c: 4000 })
  assert.deepEqual(depois.acertos, [
    { de: 'a', para: 'b', valor: 8000 },
    { de: 'a', para: 'c', valor: 4000 },
  ])
})

test('participante removido: as despesas iguais passam a ser divididas entre quem ficou', () => {
  const despesas = [{ id: 'd1', valor_total: 100, pago_por_id: 'a', divisao: 'IGUAL' }]
  assert.deepEqual(saldos(calcularRateio({ despesas, participantes })), { a: 6666, b: -3333, c: -3333 })
  assert.deepEqual(saldos(calcularRateio({ despesas, participantes: [amanda, bruno] })), { a: 5000, b: -5000 })
})

test('participante com despesa, cota ou acerto não pode ser removido', () => {
  const vazio = { despesas: [], cotas: [], pagamentos: [] }
  assert.equal(motivoParaNaoRemover(bruno, vazio), null)
  assert.match(motivoParaNaoRemover(amanda, vazio), /organizador/)
  assert.match(motivoParaNaoRemover(bruno, { ...vazio, despesas: [{ pago_por_id: 'b' }] }), /pagou/)
  assert.match(motivoParaNaoRemover(bruno, { ...vazio, cotas: [{ participante_id: 'b' }] }), /personalizada/)
  assert.match(motivoParaNaoRemover(bruno, { ...vazio, pagamentos: [{ de_id: 'c', para_id: 'b' }] }), /acertos/)
})

test('só o organizador: ninguém deve nada', () => {
  const r = calcularRateio({ despesas: [{ id: 'd1', valor_total: 500, pago_por_id: null }], participantes: [amanda] })
  assert.equal(saldos(r).a, 0)
  assert.deepEqual(r.acertos, [])
})
