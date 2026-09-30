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

// Cores da paleta original do projeto, fixas por categoria de despesa:
// o mesmo tom aparece no gráfico e no extrato.
export const CATEGORIAS_DESPESA = [
  { nome: 'Local e Cerimônia', cor: '#16a37a' },
  { nome: 'Buffet e Bebidas', cor: '#3b6fe8' },
  { nome: 'Decoração', cor: '#e8a432' },
  { nome: 'Fotografia e Vídeo', cor: '#8b5cf6' },
  { nome: 'Vestuário', cor: '#e5484d' },
  { nome: 'Música e Entretenimento', cor: '#06b6d4' },
  { nome: 'Convites e Papelaria', cor: '#f97316' },
  { nome: 'Transporte', cor: '#64748b' },
  { nome: 'Outros', cor: '#9aa0ae' },
]

export function corDespesa(categoria) {
  return CATEGORIAS_DESPESA.find((c) => c.nome === categoria)?.cor || '#c9ced8'
}

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}
