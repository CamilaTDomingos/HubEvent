// Testes dos cálculos da lista de convidados. Rodar com: npm test (usa o node:test, sem dependência).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumoConvidados, buscarConvidados, foiEnviado, acompanhantesConfirmados } from './convidados.js'

const lista = [
  { nome: 'Ana Souza', email: 'ana@x.com', status_presenca: 'CONFIRMADO', acompanhantes_permitidos: 2, acompanhantes_confirmados: 2, enviado_em: '2026-10-01' },
  { nome: 'João Lima', email: 'jl@x.com', status_presenca: 'CONFIRMADO', acompanhantes_permitidos: 3, acompanhantes_confirmados: 1, enviado_em: null },
  { nome: 'Bia', email: null, status_presenca: 'PENDENTE', acompanhantes_permitidos: 1, acompanhantes_confirmados: 0, enviado_em: '2026-10-02' },
  { nome: 'Caio', email: null, status_presenca: 'PENDENTE', acompanhantes_permitidos: 0, acompanhantes_confirmados: 0, enviado_em: null },
  { nome: 'Dani', email: 'dani@x.com', status_presenca: 'RECUSADO', acompanhantes_permitidos: 4, acompanhantes_confirmados: 0, enviado_em: null },
]

test('resumo conta convites, acompanhantes e pessoas', () => {
  assert.deepEqual(resumoConvidados(lista), {
    total: 5,
    confirmados: 2,
    pendentes: 2,
    recusados: 1,
    enviados: 4, // Bia (enviado_em) + os três que responderam
    naoEnviados: 1, // Caio
    acompanhantes: 3,
    pessoasConfirmadas: 5,
    pessoasPossiveis: 5 + 2 + 1, // Bia + 1 acompanhante, Caio sozinho
  })
})

test('lista vazia', () => {
  const r = resumoConvidados([])
  assert.equal(r.total, 0)
  assert.equal(r.pessoasConfirmadas, 0)
  assert.equal(r.pessoasPossiveis, 0)
})

test('convidado antigo sem as colunas novas não vira NaN', () => {
  const antigos = [
    { nome: 'Velho 1', status_presenca: 'CONFIRMADO' },
    { nome: 'Velho 2', status_presenca: 'PENDENTE' },
  ]
  const r = resumoConvidados(antigos)
  assert.equal(r.pessoasConfirmadas, 1)
  assert.equal(r.pessoasPossiveis, 2)
  assert.equal(r.enviados, 1)
  assert.equal(r.naoEnviados, 1)
})

test('acompanhantes de quem não confirmou não contam', () => {
  assert.equal(acompanhantesConfirmados({ status_presenca: 'RECUSADO', acompanhantes_confirmados: 3 }), 0)
})

test('enviado: data de envio ou resposta', () => {
  assert.equal(foiEnviado({ status_presenca: 'PENDENTE', enviado_em: null }), false)
  assert.equal(foiEnviado({ status_presenca: 'PENDENTE' }), false)
  assert.equal(foiEnviado({ status_presenca: 'PENDENTE', enviado_em: '2026-10-02' }), true)
  assert.equal(foiEnviado({ status_presenca: 'RECUSADO', enviado_em: null }), true)
})

test('busca ignora acento e maiúsculas e olha nome e e-mail', () => {
  assert.deepEqual(buscarConvidados(lista, 'joao').map((c) => c.nome), ['João Lima'])
  assert.deepEqual(buscarConvidados(lista, '  SOUZA ').map((c) => c.nome), ['Ana Souza'])
  assert.deepEqual(buscarConvidados(lista, 'dani@').map((c) => c.nome), ['Dani'])
  assert.equal(buscarConvidados(lista, '').length, 5)
  assert.equal(buscarConvidados(lista, 'zzz').length, 0)
})
