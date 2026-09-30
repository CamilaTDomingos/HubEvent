// Cada tipo de evento ganha uma forma e uma cor fixas. Isso vira a
// "assinatura" do evento em todas as telas (lista, cabeçalho, site).
export const TIPOS_EVENTO = {
  Casamento: { forma: 'flor', cor: 'var(--lilac)' },
  'Chá de bebê': { forma: 'circulo', cor: 'var(--sky)' },
  'Chá de panela': { forma: 'blob', cor: 'var(--mint)' },
  Aniversário: { forma: 'estrela', cor: 'var(--sun)' },
  Formatura: { forma: 'arco', cor: 'var(--tomato)' },
  Corporativo: { forma: 'quadrado', cor: 'var(--peach)' },
  Outro: { forma: 'blob', cor: 'var(--paper-3)' },
}

export function tipoEvento(categoria) {
  return TIPOS_EVENTO[categoria] || TIPOS_EVENTO.Outro
}

// Cores fixas por categoria de despesa: o mesmo tom aparece no gráfico e
// no extrato, então o olho liga um ao outro sem precisar de legenda.
export const CATEGORIAS_DESPESA = [
  { nome: 'Local e Cerimônia', cor: '#ff5b36' },
  { nome: 'Buffet e Bebidas', cor: '#ffc53d' },
  { nome: 'Decoração', cor: '#b8a4ff' },
  { nome: 'Fotografia e Vídeo', cor: '#8cc3ff' },
  { nome: 'Vestuário', cor: '#8fd9b0' },
  { nome: 'Música e Entretenimento', cor: '#1c1a17' },
  { nome: 'Convites e Papelaria', cor: '#ffb08f' },
  { nome: 'Transporte', cor: '#6d8a7a' },
  { nome: 'Outros', cor: '#c9c0ad' },
]

export function corDespesa(categoria) {
  return CATEGORIAS_DESPESA.find((c) => c.nome === categoria)?.cor || '#ddd4c1'
}

const TONS_AVATAR = ['var(--lilac)', 'var(--sky)', 'var(--mint)', 'var(--sun)', 'var(--peach)']

export function tomAvatar(texto = '') {
  let soma = 0
  for (const ch of texto) soma = (soma + ch.charCodeAt(0)) % 997
  return TONS_AVATAR[soma % TONS_AVATAR.length]
}

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}
