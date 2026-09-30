// Leitura e escrita em localStorage que nunca derrubam a página: em aba
// anônima, com o armazenamento cheio ou bloqueado, caem no valor padrão.

export function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto ? JSON.parse(bruto) : padrao
  } catch {
    return padrao
  }
}

export function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
    return true
  } catch {
    return false
  }
}
