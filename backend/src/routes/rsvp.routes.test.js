// Testes da página pública de RSVP com o Supabase simulado: um servidor
// HTTP local faz o papel do PostgREST e guarda as linhas em memória.
// Rodar com: npm test (dentro de backend/).
import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import express from 'express'

const FUTURO = '2099-12-12T22:00:00Z'
const PASSADO = '2020-01-01T22:00:00Z'

let convidados
let gravacoes
let limiteNaGravacao

function novosConvidados() {
  const evento = { nome: 'Casamento', data_inicio: FUTURO, local: 'Sítio', categoria: 'Casamento', pix_chave: 'segredo@pix' }
  return {
    ana: { id: 'ana', nome: 'Ana', email: 'ana@exemplo.com', grupo_id: 'g1', enviado_em: null, status_presenca: 'PENDENTE', acompanhantes_permitidos: 2, acompanhantes_confirmados: 0, evento },
    bia: { id: 'bia', nome: 'Bia', email: 'bia@exemplo.com', status_presenca: 'PENDENTE', acompanhantes_permitidos: 0, acompanhantes_confirmados: 0, evento },
    // Convidado de antes da migração: sem as colunas novas.
    velho: { id: 'velho', nome: 'Seu Velho', status_presenca: 'CONFIRMADO', evento },
    passado: { id: 'passado', nome: 'Caio', status_presenca: 'PENDENTE', acompanhantes_permitidos: 1, acompanhantes_confirmados: 0, evento: { ...evento, data_inicio: PASSADO } },
  }
}

// Devolve só as colunas pedidas, como o PostgREST, inclusive dentro de
// "evento:evento_id (a, b)", para o teste de privacidade valer.
function colunas(linha, select) {
  const saida = {}
  const embutido = select.match(/evento:evento_id\(([^)]*)\)/)
  if (embutido) saida.evento = Object.fromEntries(embutido[1].split(',').map((c) => [c, linha.evento[c]]))
  for (const c of select.replace(/evento:evento_id\([^)]*\)/, '').split(',').filter(Boolean)) {
    if (c in linha) saida[c] = linha[c]
  }
  return saida
}

function responder(res, status, corpo) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(corpo))
}

const supabaseFalso = http.createServer((req, res) => {
  let corpo = ''
  req.on('data', (c) => (corpo += c))
  req.on('end', () => {
    const url = new URL(req.url, 'http://x')
    const id = url.searchParams.get('id')?.replace('eq.', '')
    const linha = convidados[id]
    if (url.pathname !== '/rest/v1/convidado') return responder(res, 404, {})

    if (req.method === 'GET') {
      if (!linha) return responder(res, 406, { code: 'PGRST116', message: 'no rows' })
      return responder(res, 200, colunas(linha, url.searchParams.get('select')))
    }
    if (req.method === 'PATCH') {
      const dados = JSON.parse(corpo)
      gravacoes.push({ id, ...dados })
      // Mesma regra do CHECK do banco.
      const limite = limiteNaGravacao ?? linha.acompanhantes_permitidos ?? 0
      if (dados.acompanhantes_confirmados > limite) {
        return responder(res, 400, { code: '23514', message: 'violates check constraint' })
      }
      Object.assign(linha, dados)
      res.writeHead(204)
      return res.end()
    }
    responder(res, 405, {})
  })
})

let api
let servidorApi

before(async () => {
  await new Promise((r) => supabaseFalso.listen(0, '127.0.0.1', r))
  process.env.SUPABASE_URL = `http://127.0.0.1:${supabaseFalso.address().port}`
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-falsa'

  const { default: rotas } = await import('./rsvp.routes.js')
  const app = express()
  app.use(express.json())
  app.use('/api/rsvp', rotas)
  await new Promise((r) => (servidorApi = app.listen(0, '127.0.0.1', r)))
  api = `http://127.0.0.1:${servidorApi.address().port}/api/rsvp`
})

after(() => {
  servidorApi.close()
  supabaseFalso.closeAllConnections()
  supabaseFalso.close()
})

beforeEach(() => {
  convidados = novosConvidados()
  gravacoes = []
  limiteNaGravacao = null
})

async function responderConvite(id, corpo) {
  const res = await fetch(`${api}/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
  return { status: res.status, corpo: await res.json() }
}

test('convite devolve só os dados do próprio convidado', async () => {
  const res = await fetch(`${api}/ana`)
  const corpo = await res.json()
  assert.equal(res.status, 200)
  assert.deepEqual(corpo, {
    id: 'ana', nome: 'Ana', status_presenca: 'PENDENTE', acompanhantes_permitidos: 2, acompanhantes_confirmados: 0,
    evento: { nome: 'Casamento', data_inicio: FUTURO, local: 'Sítio', categoria: 'Casamento' },
    encerrado: false,
  })
  const texto = JSON.stringify(corpo)
  for (const vazamento of ['ana@exemplo.com', 'g1', 'enviado_em', 'segredo@pix', 'Bia']) {
    assert.ok(!texto.includes(vazamento), `vazou: ${vazamento}`)
  }
})

test('convite inexistente responde 404', async () => {
  assert.equal((await fetch(`${api}/ninguem`)).status, 404)
  assert.equal((await responderConvite('ninguem', { resposta: 'CONFIRMADO' })).status, 404)
})

test('confirma com acompanhantes dentro do limite', async () => {
  const r = await responderConvite('ana', { resposta: 'CONFIRMADO', acompanhantes: 2 })
  assert.equal(r.status, 200)
  assert.deepEqual(r.corpo, { sucesso: true, status_presenca: 'CONFIRMADO', acompanhantes_confirmados: 2 })
  assert.equal(convidados.ana.acompanhantes_confirmados, 2)
  assert.ok(convidados.ana.confirmado_em)
})

test('recusa acompanhantes acima do limite sem gravar nada', async () => {
  for (const acompanhantes of [3, 50, -1, 1.5, '2', null]) {
    const r = await responderConvite('ana', { resposta: 'CONFIRMADO', acompanhantes })
    if (acompanhantes === null) {
      // null vira 0: confirma sozinho.
      assert.equal(r.status, 200)
      continue
    }
    assert.equal(r.status, 400, `aceitou ${JSON.stringify(acompanhantes)}`)
  }
  assert.match((await responderConvite('ana', { resposta: 'CONFIRMADO', acompanhantes: 3 })).corpo.error, /até 2 acompanhantes/)
  assert.ok(gravacoes.every((g) => g.acompanhantes_confirmados === 0))
})

test('convite individual não aceita acompanhante', async () => {
  const r = await responderConvite('bia', { resposta: 'CONFIRMADO', acompanhantes: 1 })
  assert.equal(r.status, 400)
  assert.match(r.corpo.error, /individual/)
  assert.equal(gravacoes.length, 0)
})

test('recusar zera os acompanhantes, mesmo que a página mande outro número', async () => {
  await responderConvite('ana', { resposta: 'CONFIRMADO', acompanhantes: 2 })
  const r = await responderConvite('ana', { resposta: 'RECUSADO', acompanhantes: 2 })
  assert.equal(r.status, 200)
  assert.equal(convidados.ana.status_presenca, 'RECUSADO')
  assert.equal(convidados.ana.acompanhantes_confirmados, 0)
})

test('dá para mudar a resposta antes do evento', async () => {
  await responderConvite('ana', { resposta: 'RECUSADO' })
  const r = await responderConvite('ana', { resposta: 'CONFIRMADO', acompanhantes: 1 })
  assert.equal(r.status, 200)
  assert.equal(convidados.ana.status_presenca, 'CONFIRMADO')
  assert.equal(convidados.ana.acompanhantes_confirmados, 1)
})

test('depois que o evento começa, as respostas ficam encerradas', async () => {
  const convite = await (await fetch(`${api}/passado`)).json()
  assert.equal(convite.encerrado, true)
  const r = await responderConvite('passado', { resposta: 'CONFIRMADO' })
  assert.equal(r.status, 409)
  assert.equal(gravacoes.length, 0)
})

test('convidado antigo, sem as colunas novas, confirma sozinho', async () => {
  const r = await responderConvite('velho', { resposta: 'CONFIRMADO' })
  assert.equal(r.status, 200)
  assert.equal(convidados.velho.acompanhantes_confirmados, 0)
  assert.equal((await responderConvite('velho', { resposta: 'CONFIRMADO', acompanhantes: 1 })).status, 400)
})

test('resposta inválida responde 400', async () => {
  assert.equal((await responderConvite('ana', { resposta: 'TALVEZ' })).status, 400)
  assert.equal(gravacoes.length, 0)
})

test('limite baixado enquanto a página estava aberta vira 409, não 500', async () => {
  limiteNaGravacao = 0 // o organizador mudou o convite entre a leitura e a gravação
  const r = await responderConvite('ana', { resposta: 'CONFIRMADO', acompanhantes: 2 })
  assert.equal(r.status, 409)
  assert.match(r.corpo.error, /Recarregue/)
})
