import { GoogleGenAI } from '@google/genai'

// Cliente do Gemini usado pelo assistente de planejamento. A chave fica só
// aqui no backend (GEMINI_API_KEY); o navegador nunca fala com o Gemini.
// As variáveis são lidas na hora do uso porque o dotenv.config() do
// server.js roda depois dos imports.

// Alias documentado pelo SDK oficial (@google/genai) que aponta para o
// Flash estável mais recente. Para fixar uma versão, defina GEMINI_MODEL.
const MODELO_PADRAO = 'gemini-flash-latest'
const TEMPO_PADRAO_MS = 30000

export const modeloGemini = () => process.env.GEMINI_MODEL || MODELO_PADRAO
export const geminiConfigurado = () => Boolean(clienteTeste || process.env.GEMINI_API_KEY)

// Erro com código e status HTTP, para a rota responder uma mensagem clara.
export class ErroAssistente extends Error {
  constructor(codigo, status, mensagem) {
    super(mensagem)
    this.codigo = codigo
    this.status = status
  }
}

let cliente = null
let clienteTeste = null

// Nos testes, troca o cliente real por um simulado.
export function definirClienteGemini(simulado) {
  clienteTeste = simulado
}

function obterCliente() {
  if (clienteTeste) return clienteTeste
  if (!process.env.GEMINI_API_KEY) {
    throw new ErroAssistente('SEM_CHAVE', 503, 'O assistente ainda não foi configurado no servidor (falta a chave do Gemini).')
  }
  cliente ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  return cliente
}

// Formato que a IA deve devolver: o texto da conversa e, quando fizer
// sentido, as tarefas sugeridas para o checklist.
const ESQUEMA_RESPOSTA = {
  type: 'object',
  properties: {
    resposta: {
      type: 'string',
      description: 'Texto da resposta ao organizador, em português do Brasil, sem Markdown.',
    },
    tarefas: {
      type: 'array',
      description: 'Tarefas sugeridas para o checklist. Lista vazia quando a resposta não sugere tarefas.',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string', description: 'Ação curta, começando com verbo. Até 80 caracteres.' },
          descricao: { type: 'string', description: 'Detalhe opcional em uma frase. Vazio se não precisar.' },
          prazo: { type: 'string', description: 'Data no formato AAAA-MM-DD entre hoje e o dia do evento, ou vazio.' },
          categoria: { type: 'string', description: 'Uma das categorias de tarefa informadas, escrita igual, ou vazio.' },
        },
        required: ['titulo', 'descricao', 'prazo', 'categoria'],
      },
    },
  },
  required: ['resposta', 'tarefas'],
}

const MAX_TAREFAS = 15
const DATA = /^\d{4}-\d{2}-\d{2}$/

function dataValida(texto) {
  if (!DATA.test(texto || '')) return null
  const data = new Date(`${texto}T12:00:00Z`)
  return Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== texto ? null : texto
}

const cortar = (texto, max) => String(texto ?? '').trim().slice(0, max)

// Confere o JSON da IA e descarta o que não serve, em vez de confiar nele.
export function normalizarResposta(bruto) {
  let dados
  try {
    dados = JSON.parse(bruto)
  } catch {
    throw new ErroAssistente('RESPOSTA_VAZIA', 502, 'A IA devolveu uma resposta que não deu para entender. Tente de novo.')
  }

  const resposta = cortar(dados?.resposta, 8000)
  const tarefas = (Array.isArray(dados?.tarefas) ? dados.tarefas : [])
    .map((t) => ({
      titulo: cortar(t?.titulo, 255),
      descricao: cortar(t?.descricao, 500),
      prazo: dataValida(cortar(t?.prazo, 10)),
      categoria: cortar(t?.categoria, 60),
    }))
    .filter((t) => t.titulo)
    .slice(0, MAX_TAREFAS)

  if (!resposta && tarefas.length === 0) {
    throw new ErroAssistente('RESPOSTA_VAZIA', 502, 'A IA não devolveu nenhuma resposta. Tente de novo.')
  }
  return { resposta: resposta || 'Separei algumas tarefas para o seu checklist:', tarefas }
}

function traduzirErro(erro) {
  if (erro instanceof ErroAssistente) return erro
  if (erro?.name === 'TimeoutError' || erro?.name === 'AbortError') {
    return new ErroAssistente('TEMPO_ESGOTADO', 504, 'A IA demorou demais para responder. Tente de novo.')
  }
  const status = erro?.status
  if (status === 429) {
    return new ErroAssistente('LIMITE_GEMINI', 429, 'O limite de uso gratuito da IA foi atingido. Espere alguns minutos e tente de novo.')
  }
  if (status === 401 || status === 403 || /API key/i.test(erro?.message || '')) {
    return new ErroAssistente('CHAVE_INVALIDA', 503, 'A chave do Gemini configurada no servidor não foi aceita.')
  }
  if (status === 404) {
    return new ErroAssistente('MODELO_INVALIDO', 503, 'O modelo de IA configurado no servidor não existe mais. Confira o GEMINI_MODEL.')
  }
  return new ErroAssistente('FALHA_IA', 502, 'Não foi possível falar com a IA agora. Tente de novo.')
}

// Envia a conversa ao Gemini e devolve { resposta, tarefas }.
// historico: [{ papel: 'usuario' | 'ia', texto }], do mais antigo ao mais novo.
export async function perguntarAoGemini({ instrucoes, historico, pergunta }) {
  const ia = obterCliente()
  const tempoLimite = Number(process.env.GEMINI_TIMEOUT_MS) || TEMPO_PADRAO_MS

  const contents = [
    ...historico.map((m) => ({ role: m.papel === 'ia' ? 'model' : 'user', parts: [{ text: m.texto }] })),
    { role: 'user', parts: [{ text: pergunta }] },
  ]

  let resultado
  try {
    resultado = await ia.models.generateContent({
      model: modeloGemini(),
      contents,
      config: {
        systemInstruction: instrucoes,
        responseMimeType: 'application/json',
        responseJsonSchema: ESQUEMA_RESPOSTA,
        temperature: 0.6,
        abortSignal: AbortSignal.timeout(tempoLimite),
      },
    })
  } catch (erro) {
    throw traduzirErro(erro)
  }

  const texto = resultado?.text
  if (!texto?.trim()) {
    const bloqueio = resultado?.promptFeedback?.blockReason
    throw new ErroAssistente(
      'RESPOSTA_VAZIA',
      502,
      bloqueio ? 'A IA não quis responder a esse pedido. Tente escrever de outro jeito.' : 'A IA não devolveu nenhuma resposta. Tente de novo.'
    )
  }
  return normalizarResposta(texto)
}
