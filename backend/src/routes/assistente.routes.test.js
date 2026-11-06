// Testes da rota do assistente com o Supabase e o Gemini simulados: um
// servidor HTTP local faz o papel do Supabase (Auth + PostgREST) e um objeto
// com models.generateContent faz o papel do cliente do Gemini.
// Rodar com: npm test (dentro de backend/).
import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import express from 'express'

const EVENTO = '11111111-1111-4111-8111-111111111111'
const EVENTO_DE_OUTRO = '22222222-2222-4222-8222-222222222222'
const ASSISTENTE = '33333333-3333-4333-8333-333333333333'

const USUARIOS = { 'token-ana': { id: 'u-ana', email: 'ana@exemplo.com' }, 'token-bia': { id: 'u-bia', email: 'bia@exemplo.com' } }

const EVENTOS = {
  [EVENTO]: {
    id: EVENTO, organizador_id: 'u-ana', nome: 'Aniversário de 30 anos', categoria: 'Aniversário',
    data_inicio: '2026-12-12T22:00:00Z', data_fim: '2026-12-13T03:00:00Z', local: 'Salão Jardim', orcamento_estimado: '5000.00',
  },
  [EVENTO_DE_OUTRO]: { id: EVENTO_DE_OUTRO, organizador_id: 'u-bia', nome: 'Outro', data_inicio: '2026-12-01T20:00:00Z', data_fim: '2026-12-01T23:00:00Z' },
}

// Linhas "completas", como no banco. O servidor falso só devolve as colunas
// pedidas no select, igual ao PostgREST, para o teste de privacidade valer.
const CONVIDADOS = [
  { nome: 'Carlos Pereira', email: 'carlos@exemplo.com', status_presenca: 'CONFIRMADO', acompanhantes_confirmados: 2 },
  { nome: 'Dora Lima', email: 'dora@exemplo.com', status_presenca: 'CONFIRMADO', acompanhantes_confirmados: 0 },
  { nome: 'Edu Souza', email: 'edu@exemplo.com', status_presenca: 'PENDENTE', acompanhantes_confirmados: 0 },
  { nome: 'Fê Alves', email: 'fe@exemplo.com', status_presenca: 'RECUSADO', acompanhantes_confirmados: 0 },
]

let requisicoes = []
let historico = []
let gravadas = []
let assistenteAtivo = true

function colunas(linha, select) {
  if (!select || select === '*') return linha
  return Object.fromEntries(select.split(',').map((c) => c.trim()).filter((c) => !c.includes('(')).map((c) => [c, linha[c]]))
}

function responder(res, req, status, corpo) {
  const objeto = (req.headers.accept || '').includes('vnd.pgrst.object')
  const dados = objeto && Array.isArray(corpo) ? corpo[0] ?? null : corpo
  if (objeto && dados === null) {
    res.writeHead(406, { 'content-type': 'application/json' })
    return res.end(JSON.stringify({ code: 'PGRST116', message: 'no rows' }))
  }
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(dados))
}

const supabaseFalso = http.createServer((req, res) => {
  let corpo = ''
  req.on('data', (c) => (corpo += c))
  req.on('end', () => {
    const url = new URL(req.url, 'http://x')
    const tabela = url.pathname.replace('/rest/v1/', '')
    const select = url.searchParams.get('select')
    requisicoes.push({ metodo: req.method, tabela, select, busca: url.search, corpo })

    if (url.pathname === '/auth/v1/user') {
      const usuario = USUARIOS[(req.headers.authorization || '').replace('Bearer ', '')]
      res.writeHead(usuario ? 200 : 401, { 'content-type': 'application/json' })
      return res.end(JSON.stringify(usuario ? { ...usuario, aud: 'authenticated' } : { code: 401, msg: 'invalid JWT' }))
    }

    if (tabela === 'evento') {
      const id = url.searchParams.get('id')?.replace('eq.', '')
      return responder(res, req, 200, EVENTOS[id] ? [EVENTOS[id]] : [])
    }
    if (tabela === 'assistente_ia') return responder(res, req, 201, [{ id: ASSISTENTE, ativo: assistenteAtivo }])
    if (tabela === 'convidado') return responder(res, req, 200, CONVIDADOS.map((c) => colunas(c, select)))
    if (tabela === 'despesa') {
      return responder(res, req, 200, [
        { valor_total: '1200.00', pago: true, categoria_despesa: { nome: 'Buffet' } },
        { valor_total: '300.50', pago: false, categoria_despesa: null },
      ])
    }
    if (tabela === 'tarefa') return responder(res, req, 200, [{ titulo: 'Reservar o salão', status: 'CONCLUIDA', prazo: '2026-10-01', categoria: { nome: 'Local' } }])
    if (tabela === 'lista_presentes') return responder(res, req, 200, [{ quantidade: 2, valor: '100' }])
    if (tabela === 'categoria_tarefa') return responder(res, req, 200, [{ nome: 'Comida' }, { nome: 'Local' }])
    if (tabela === 'mensagem_chat' && req.method === 'GET') return responder(res, req, 200, [...historico].reverse())
    if (tabela === 'mensagem_chat' && req.method === 'POST') {
      const linhas = JSON.parse(corpo).map((l, i) => ({ id: `m-${gravadas.length + i}`, dados: null, ...l }))
      gravadas.push(...linhas)
      // Devolve fora de ordem de propósito: a rota é que ordena.
      return responder(res, req, 201, [...linhas].reverse())
    }
    res.writeHead(404)
    res.end('{}')
  })
})

// Gemini simulado: cada teste define o que a próxima chamada faz.
let comportamento
const chamadasGemini = []
const geminiFalso = {
  models: {
    generateContent: async (params) => {
      chamadasGemini.push(params)
      return comportamento(params)
    },
  },
}
const respostaJson = (obj) => () => ({ text: JSON.stringify(obj) })

let api
let servidorApi
let gemini
let limiteUso

before(async () => {
  await new Promise((r) => supabaseFalso.listen(0, '127.0.0.1', r))
  process.env.SUPABASE_URL = `http://127.0.0.1:${supabaseFalso.address().port}`
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-falsa'
  process.env.ASSISTENTE_LIMITE_MINUTO = '100'
  delete process.env.GEMINI_API_KEY

  const { default: rotas } = await import('./assistente.routes.js')
  gemini = await import('../services/gemini.js')
  limiteUso = await import('../services/limiteUso.js')

  const app = express()
  app.use(express.json())
  app.use('/api/assistente', rotas)
  await new Promise((r) => (servidorApi = app.listen(0, '127.0.0.1', r)))
  api = `http://127.0.0.1:${servidorApi.address().port}/api/assistente`
})

after(() => {
  servidorApi.close()
  supabaseFalso.closeAllConnections()
  supabaseFalso.close()
})

beforeEach(() => {
  requisicoes = []
  historico = []
  gravadas = []
  chamadasGemini.length = 0
  assistenteAtivo = true
  limiteUso.zerarUsos()
  gemini.definirClienteGemini(geminiFalso)
  comportamento = respostaJson({ resposta: 'Olá!', tarefas: [] })
})

async function enviar(corpo, { token = 'token-ana', evento = EVENTO } = {}) {
  const res = await fetch(`${api}/${evento}/mensagens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(corpo),
  })
  return { status: res.status, corpo: await res.json(), cabecalhos: res.headers }
}

test('sem token responde 401 e não chama a IA', async () => {
  const r = await enviar({ mensagem: 'oi' }, { token: null })
  assert.equal(r.status, 401)
  assert.equal(r.corpo.codigo, 'SEM_LOGIN')
  assert.equal(chamadasGemini.length, 0)
})

test('token inválido responde 401', async () => {
  const r = await enviar({ mensagem: 'oi' }, { token: 'token-falso' })
  assert.equal(r.status, 401)
  assert.equal(chamadasGemini.length, 0)
})

test('quem não é o organizador recebe 404 e a IA não é chamada', async () => {
  const r = await enviar({ mensagem: 'oi' }, { evento: EVENTO_DE_OUTRO })
  assert.equal(r.status, 404)
  assert.equal(chamadasGemini.length, 0)
  assert.ok(!requisicoes.some((q) => q.tabela === 'mensagem_chat'))
})

test('id de evento inválido responde 404 sem consultar o banco', async () => {
  const r = await enviar({ mensagem: 'oi' }, { evento: 'nao-e-uuid' })
  assert.equal(r.status, 404)
  assert.ok(!requisicoes.some((q) => q.tabela === 'evento'))
})

test('mensagem vazia ou longa demais responde 400', async () => {
  assert.equal((await enviar({ mensagem: '   ' })).status, 400)
  assert.equal((await enviar({ atalho: 'inexistente' })).status, 400)
  assert.equal((await enviar({ mensagem: 'x'.repeat(2001) })).corpo.codigo, 'MENSAGEM_LONGA')
  assert.equal(chamadasGemini.length, 0)
})

test('atalho de checklist: manda só dados agregados, pede JSON e grava as duas mensagens', async () => {
  historico = [
    { tipo: 'USUARIO', conteudo: 'Quantos salgados?' },
    { tipo: 'IA', conteudo: 'Uns 20 por pessoa.' },
  ]
  comportamento = respostaJson({
    resposta: 'Aqui vão as tarefas que faltam.',
    tarefas: [
      { titulo: 'Contratar buffet', descricao: 'Pedir 3 orçamentos', prazo: '2026-11-01', categoria: 'Comida' },
      { titulo: 'Comprar velas', descricao: '', prazo: '2026-02-30', categoria: '' },
      { titulo: '   ', descricao: 'sem título', prazo: '', categoria: '' },
    ],
  })

  const r = await enviar({ atalho: 'checklist' })
  assert.equal(r.status, 200)

  // Resposta em ordem: pergunta e depois a resposta da IA.
  const [usuario, ia] = r.corpo.mensagens
  assert.equal(usuario.tipo, 'USUARIO')
  assert.equal(usuario.conteudo, 'Sugerir checklist')
  assert.equal(ia.tipo, 'IA')
  assert.equal(ia.conteudo, 'Aqui vão as tarefas que faltam.')
  assert.deepEqual(ia.dados.adicionadas, [])
  assert.deepEqual(ia.dados.tarefas, [
    { titulo: 'Contratar buffet', descricao: 'Pedir 3 orçamentos', prazo: '2026-11-01', categoria: 'Comida' },
    { titulo: 'Comprar velas', descricao: '', prazo: null, categoria: '' }, // 30/02 não existe
  ])
  assert.ok(Date.parse(usuario.criado_em) < Date.parse(ia.criado_em))
  assert.ok(gravadas.every((m) => m.usuario_id === 'u-ana' && m.assistente_id === ASSISTENTE))

  // Pedido ao Gemini: JSON com esquema, histórico em ordem e a instrução do atalho.
  const chamada = chamadasGemini[0]
  assert.equal(chamada.config.responseMimeType, 'application/json')
  assert.ok(chamada.config.responseJsonSchema.properties.tarefas)
  assert.ok(chamada.config.abortSignal instanceof AbortSignal)
  assert.deepEqual(chamada.contents.map((c) => c.role), ['user', 'model', 'user'])
  assert.equal(chamada.contents[0].parts[0].text, 'Quantos salgados?')
  assert.match(chamada.contents[2].parts[0].text, /Não repita tarefas/)

  // Privacidade: os convidados viram só contagens.
  const instrucoes = chamada.config.systemInstruction
  assert.match(instrucoes, /"convidados":\{"total":4,"confirmados":2,"pendentes":1,"recusados":1,"pessoasConfirmadas":4\}/)
  assert.match(instrucoes, /"totalGasto":1500\.5/)
  assert.match(instrucoes, /"porCategoria":\{"Buffet":1200,"Sem categoria":300\.5\}/)
  assert.match(instrucoes, /"Reservar o salão"/)
  assert.match(instrucoes, /"inicio":"2026-12-12 19:00"/) // 22h UTC = 19h em Brasília
  for (const c of CONVIDADOS) {
    assert.ok(!instrucoes.includes(c.nome), `nome de convidado vazou: ${c.nome}`)
    assert.ok(!instrucoes.includes(c.email), `e-mail de convidado vazou: ${c.email}`)
  }
  assert.equal(requisicoes.find((q) => q.tabela === 'convidado').select, 'status_presenca,acompanhantes_confirmados')
})

test('resposta sem tarefas grava dados nulos', async () => {
  const r = await enviar({ mensagem: 'Bom dia!' })
  assert.equal(r.status, 200)
  assert.equal(r.corpo.mensagens[0].conteudo, 'Bom dia!')
  assert.equal(r.corpo.mensagens[1].dados, null)
})

test('limite do Gemini (429) vira mensagem clara e nada é gravado', async () => {
  comportamento = () => {
    const erro = new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}')
    erro.status = 429
    throw erro
  }
  const r = await enviar({ mensagem: 'oi' })
  assert.equal(r.status, 429)
  assert.equal(r.corpo.codigo, 'LIMITE_GEMINI')
  assert.equal(gravadas.length, 0)
})

test('timeout da IA responde 504', async () => {
  process.env.GEMINI_TIMEOUT_MS = '50'
  comportamento = (params) =>
    new Promise((_, rejeitar) => {
      params.config.abortSignal.addEventListener('abort', () => rejeitar(new DOMException('This operation was aborted', 'AbortError')))
    })
  try {
    const r = await enviar({ mensagem: 'oi' })
    assert.equal(r.status, 504)
    assert.equal(r.corpo.codigo, 'TEMPO_ESGOTADO')
    assert.equal(gravadas.length, 0)
  } finally {
    delete process.env.GEMINI_TIMEOUT_MS
  }
})

test('resposta vazia ou JSON quebrado responde 502', async () => {
  comportamento = () => ({ text: '' })
  assert.equal((await enviar({ mensagem: 'oi' })).corpo.codigo, 'RESPOSTA_VAZIA')
  comportamento = () => ({ text: '{"resposta": "corta' })
  assert.equal((await enviar({ mensagem: 'oi' })).corpo.codigo, 'RESPOSTA_VAZIA')
  comportamento = respostaJson({ resposta: '', tarefas: [] })
  assert.equal((await enviar({ mensagem: 'oi' })).status, 502)
  assert.equal(gravadas.length, 0)
})

test('chave inválida e erro desconhecido do Gemini', async () => {
  comportamento = () => {
    const erro = new Error('API key not valid. Please pass a valid API key.')
    erro.status = 400
    throw erro
  }
  assert.equal((await enviar({ mensagem: 'oi' })).corpo.codigo, 'CHAVE_INVALIDA')
  comportamento = () => {
    throw new Error('socket hang up')
  }
  const r = await enviar({ mensagem: 'oi' })
  assert.equal(r.status, 502)
  assert.equal(r.corpo.codigo, 'FALHA_IA')
})

test('sem GEMINI_API_KEY responde 503 sem gastar o limite', async () => {
  gemini.definirClienteGemini(null)
  const r = await enviar({ mensagem: 'oi' })
  assert.equal(r.status, 503)
  assert.equal(r.corpo.codigo, 'SEM_CHAVE')
  assert.equal(limiteUso.consumirUso('u-ana').permitido, true)
})

test('assistente desativado responde 403', async () => {
  assistenteAtivo = false
  const r = await enviar({ mensagem: 'oi' })
  assert.equal(r.status, 403)
  assert.equal(chamadasGemini.length, 0)
})

test('limite por usuário: a terceira pergunta no minuto é recusada', async () => {
  process.env.ASSISTENTE_LIMITE_MINUTO = '2'
  try {
    assert.equal((await enviar({ mensagem: '1' })).status, 200)
    assert.equal((await enviar({ mensagem: '2' })).status, 200)
    const r = await enviar({ mensagem: '3' })
    assert.equal(r.status, 429)
    assert.equal(r.corpo.codigo, 'LIMITE_USUARIO')
    assert.ok(Number(r.cabecalhos.get('retry-after')) > 0)
    assert.equal(chamadasGemini.length, 2)
  } finally {
    process.env.ASSISTENTE_LIMITE_MINUTO = '100'
  }
})

test('limite por usuário libera depois da janela e conta cada usuário à parte', () => {
  process.env.ASSISTENTE_LIMITE_MINUTO = '1'
  process.env.ASSISTENTE_LIMITE_DIA = '2'
  try {
    const t = 1_000_000_000
    assert.equal(limiteUso.consumirUso('a', t).permitido, true)
    const bloqueado = limiteUso.consumirUso('a', t + 10_000)
    assert.equal(bloqueado.permitido, false)
    assert.equal(bloqueado.esperarSegundos, 50)
    assert.equal(limiteUso.consumirUso('b', t + 10_000).permitido, true)
    assert.equal(limiteUso.consumirUso('a', t + 61_000).permitido, true)
    const doDia = limiteUso.consumirUso('a', t + 200_000)
    assert.equal(doDia.permitido, false)
    assert.equal(doDia.doDia, true)
    assert.equal(limiteUso.consumirUso('a', t + 24 * 3600_000 + 1).permitido, true)
  } finally {
    process.env.ASSISTENTE_LIMITE_MINUTO = '100'
    delete process.env.ASSISTENTE_LIMITE_DIA
  }
})
