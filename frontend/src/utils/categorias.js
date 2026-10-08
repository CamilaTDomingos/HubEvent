// Cada tipo de evento tem um ícone discreto. A plataforma fica neutra e
// o evento ganha identidade sem depender de cor.
export const TIPOS_EVENTO = {
  Casamento: { icone: 'aneis' },
  'Chá de bebê': { icone: 'chocalho' },
  'Chá de panela': { icone: 'panela' },
  Aniversário: { icone: 'bolo' },
  Formatura: { icone: 'capelo' },
  Corporativo: { icone: 'maleta' },
  Outro: { icone: 'brilho' },
}

export function tipoEvento(categoria) {
  return TIPOS_EVENTO[categoria] || TIPOS_EVENTO.Outro
}

// Cor das despesas sem categoria (no gráfico e no extrato).
export const COR_SEM_CATEGORIA = '#c9ced8'

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

// Categorias da lista de presentes. Usam só ícones: o status é quem carrega cor.
export const CATEGORIAS_PRESENTE = [
  { nome: 'Cozinha', icone: 'panela' },
  { nome: 'Mesa posta', icone: 'presente' },
  { nome: 'Cama e banho', icone: 'casa' },
  { nome: 'Casa e decoração', icone: 'casa' },
  { nome: 'Eletroportáteis', icone: 'presente' },
  { nome: 'Experiências', icone: 'brilho' },
  { nome: 'Outros', icone: 'presente' },
]

export function iconePresente(categoria) {
  return CATEGORIAS_PRESENTE.find((c) => c.nome === categoria)?.icone || 'presente'
}
