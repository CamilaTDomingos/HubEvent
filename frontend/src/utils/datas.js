const DIA_MS = 24 * 60 * 60 * 1000

// Datas sem horário ("2026-11-14") são lidas pelo JS como UTC e voltam um
// dia no fuso do Brasil; forçamos meia-noite local nesses casos.
export function paraData(valor) {
  if (!valor) return null
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return new Date(`${valor}T00:00:00`)
  }
  return new Date(valor)
}

function inicioDoDia(data) {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  return d
}

export function diasAte(valor) {
  const data = paraData(valor)
  if (!data) return null
  return Math.round((inicioDoDia(data) - inicioDoDia(new Date())) / DIA_MS)
}

export function rotuloContagem(valor) {
  const dias = diasAte(valor)
  if (dias === null) return ''
  if (dias === 0) return 'é hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  if (dias > 0) return `em ${dias} dias`
  return `há ${Math.abs(dias)} dias`
}

export function formatar(valor, opcoes) {
  const data = paraData(valor)
  if (!data) return ''
  return data.toLocaleDateString('pt-BR', opcoes)
}

// "AAAA-MM-DD" no fuso local (toISOString usaria UTC e erraria o dia à noite).
export function dataISO(data = new Date()) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

// Soma meses a uma data "AAAA-MM-DD" sem transbordar: 31/01 + 1 mês = 28/02
// (setMonth daria 03/03 e jogaria a parcela no mês errado).
export function somarMeses(iso, meses) {
  const [ano, mes, diaDoMes] = iso.split('-').map(Number)
  const ultimoDia = new Date(ano, mes - 1 + meses + 1, 0).getDate()
  return dataISO(new Date(ano, mes - 1 + meses, Math.min(diaDoMes, ultimoDia)))
}

export const dia = (v) => formatar(v, { day: '2-digit' })
export const mesCurto = (v) => formatar(v, { month: 'short' }).replace('.', '')
export const semanaCurta = (v) => formatar(v, { weekday: 'short' }).replace('.', '')
export const dataLonga = (v) => formatar(v, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const dataMedia = (v) => formatar(v, { day: 'numeric', month: 'long' })
export const mesAno = (v) => formatar(v, { month: 'long', year: 'numeric' })

export function hora(valor) {
  const data = paraData(valor)
  if (!data) return ''
  const h = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return h === '00:00' ? '' : h
}

export function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function nomeDoUsuario(usuario) {
  const nome = usuario?.user_metadata?.nome
  if (nome) return nome.split(' ')[0]
  return usuario?.email?.split('@')[0] ?? ''
}

export function moeda(valor, casas = 2) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}
