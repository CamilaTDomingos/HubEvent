// Testes da validação do formulário do SAC. Rodar com: npm test (usa o node:test, sem dependência).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarMensagem, segundosParaNovoEnvio, LIMITES } from './sac.js'

const valido = { nome: 'Ana', email: 'ana@x.com', assunto: 'Dúvida', mensagem: 'Como convido alguém?' }

test('formulário completo passa', () => {
  assert.equal(validarMensagem(valido), null)
})

test('campo vazio ou só com espaços é recusado', () => {
  assert.equal(validarMensagem({ ...valido, nome: '' }), 'Informe o nome.')
  assert.equal(validarMensagem({ ...valido, assunto: '   ' }), 'Informe o assunto.')
  assert.equal(validarMensagem({ ...valido, mensagem: '\n\n' }), 'Informe a mensagem.')
})

test('texto acima do limite é recusado', () => {
  assert.equal(validarMensagem({ ...valido, mensagem: 'a'.repeat(LIMITES.mensagem) }), null)
  assert.match(validarMensagem({ ...valido, mensagem: 'a'.repeat(LIMITES.mensagem + 1) }), /no máximo 2000/)
  assert.match(validarMensagem({ ...valido, assunto: 'a'.repeat(LIMITES.assunto + 1) }), /no máximo 120/)
})

test('e-mail sem formato válido é recusado', () => {
  assert.equal(validarMensagem({ ...valido, email: 'ana.x.com' }), 'Informe um e-mail válido.')
  assert.equal(validarMensagem({ ...valido, email: 'ana@x' }), 'Informe um e-mail válido.')
})

test('tempo de espera conta a partir do último envio', () => {
  const agora = Date.parse('2026-10-15T12:00:00Z')
  assert.equal(segundosParaNovoEnvio(null, agora), 0)
  assert.equal(segundosParaNovoEnvio('2026-10-15T11:59:45Z', agora), 45)
  assert.equal(segundosParaNovoEnvio('2026-10-15T11:58:00Z', agora), 0)
})
