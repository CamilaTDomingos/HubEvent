// Cores sugeridas para categorias de tarefa. O usuário pode escolher
// qualquer outra pelo seletor; estas só aceleram a escolha.
export const PALETA_CATEGORIAS = [
  '#3b6fe8', '#e5484d', '#e8a432', '#2f9e6b', '#8b5cf6',
  '#d9468f', '#f07c3a', '#0ea5b7', '#7a6f5d', '#64748b',
]

const normalizar = (cor) => cor?.toLowerCase()

export function corEmUso(categorias, cor, ignorarId) {
  return categorias.find((c) => c.id !== ignorarId && normalizar(c.cor) === normalizar(cor))
}

// Primeira cor da paleta que nenhuma categoria usa ainda.
export function proximaCor(categorias) {
  return PALETA_CATEGORIAS.find((cor) => !corEmUso(categorias, cor)) ?? PALETA_CATEGORIAS[0]
}
