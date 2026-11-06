// Limite simples de perguntas ao assistente por usuário, para não estourar a
// cota gratuita do Gemini. Fica em memória: zera quando o servidor reinicia
// e não é compartilhado entre várias instâncias, o que basta para o TCC.

const MINUTO = 60 * 1000
const DIA = 24 * 60 * MINUTO

const usos = new Map() // usuarioId -> horários dos usos nas últimas 24h

const limites = () => ({
  porMinuto: Number(process.env.ASSISTENTE_LIMITE_MINUTO) || 5,
  porDia: Number(process.env.ASSISTENTE_LIMITE_DIA) || 50,
})

// Registra um uso se ainda houver espaço. Sem espaço, devolve em quantos
// segundos o próximo uso fica liberado.
export function consumirUso(usuarioId, agora = Date.now()) {
  const { porMinuto, porDia } = limites()
  const doDia = (usos.get(usuarioId) || []).filter((t) => agora - t < DIA)
  const doMinuto = doDia.filter((t) => agora - t < MINUTO)

  let liberaEm = null
  if (doDia.length >= porDia) liberaEm = doDia[doDia.length - porDia] + DIA
  else if (doMinuto.length >= porMinuto) liberaEm = doMinuto[doMinuto.length - porMinuto] + MINUTO

  if (liberaEm) {
    usos.set(usuarioId, doDia)
    return { permitido: false, esperarSegundos: Math.max(1, Math.ceil((liberaEm - agora) / 1000)), doDia: doDia.length >= porDia }
  }

  doDia.push(agora)
  usos.set(usuarioId, doDia)
  return { permitido: true }
}

// Só para os testes.
export function zerarUsos() {
  usos.clear()
}
