import { useEffect, useState, useCallback } from 'react'

// Lista de presentes com dados mockados. A tabela `lista_presentes` já existe
// no schema, mas ainda não tem categoria, imagem e quantidade; até ela ganhar
// esses campos, os itens vivem em memória, por evento, durante a sessão.
// A interface do hook segue a de useDespesas/useConvidados para que a troca
// pelo Supabase fique restrita a este arquivo.

const ATRASO_MS = 450

const SEMENTE = [
  { nome: 'Jogo de taças de cristal', valor: 249.9, categoria: 'Mesa posta', quantidade: 1, reservados: 0, descricao: 'Seis taças para vinho tinto, em cristal lapidado.' },
  { nome: 'Jogo de cama queen', valor: 389.9, categoria: 'Cama e banho', quantidade: 1, reservados: 1, reservadoPor: 'Tia Marta', descricao: 'Percal 400 fios, em tons claros.' },
  { nome: 'Cafeteira', valor: 699, categoria: 'Eletroportáteis', quantidade: 1, reservados: 0, descricao: 'Cafeteira espresso com vaporizador de leite.' },
  { nome: 'Air fryer', valor: 549.9, categoria: 'Eletroportáteis', quantidade: 1, reservados: 1, reservadoPor: 'Carlos e Júlia', descricao: 'Capacidade de 5 litros, com cesto antiaderente.' },
  { nome: 'Conjunto de panelas', valor: 799, categoria: 'Cozinha', quantidade: 1, reservados: 0, descricao: 'Cinco peças em inox com fundo triplo.' },
  { nome: 'Toalhas de banho', valor: 89.9, categoria: 'Cama e banho', quantidade: 4, reservados: 3, reservadoPor: 'Família Souza', descricao: 'Toalhas de algodão egípcio, 70 × 140 cm.' },
  { nome: 'Pratos de sobremesa', valor: 159, categoria: 'Mesa posta', quantidade: 2, reservados: 1, reservadoPor: 'Renata', descricao: 'Jogo com seis pratos de porcelana branca.' },
  { nome: 'Vaso de cerâmica', valor: 179.9, categoria: 'Casa e decoração', quantidade: 1, reservados: 0, descricao: 'Peça artesanal em cerâmica esmaltada.' },
]

const armazem = new Map()

export function esgotado(presente) {
  return presente.reservados >= presente.quantidade
}

function itensDoEvento(eventoId) {
  if (!armazem.has(eventoId)) {
    armazem.set(
      eventoId,
      SEMENTE.map((p, i) => ({ id: `${eventoId}-${i}`, imagem: null, reservadoPor: null, ...p }))
    )
  }
  return armazem.get(eventoId)
}

function salvar(eventoId, itens) {
  armazem.set(eventoId, itens)
  return itens
}

export function usePresentes(eventoId) {
  const [presentes, setPresentes] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscarPresentes = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    await new Promise((r) => setTimeout(r, ATRASO_MS))
    setPresentes([...itensDoEvento(eventoId)])
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarPresentes()
  }, [buscarPresentes])

  const cadastrar = useCallback(
    (dados) => {
      const novo = { id: crypto.randomUUID(), reservados: 0, reservadoPor: null, ...dados }
      setPresentes(salvar(eventoId, [...itensDoEvento(eventoId), novo]))
    },
    [eventoId]
  )

  // Reserva uma unidade; o item só aparece como reservado quando todas forem.
  const reservar = useCallback(
    (presenteId, nome) => {
      const itens = itensDoEvento(eventoId).map((p) =>
        p.id === presenteId && p.reservados < p.quantidade
          ? { ...p, reservados: p.reservados + 1, reservadoPor: nome || p.reservadoPor }
          : p
      )
      setPresentes(salvar(eventoId, itens))
    },
    [eventoId]
  )

  const remover = useCallback(
    (presenteId) => {
      setPresentes(salvar(eventoId, itensDoEvento(eventoId).filter((p) => p.id !== presenteId)))
    },
    [eventoId]
  )

  return { presentes, carregando, recarregar: buscarPresentes, cadastrar, reservar, remover }
}
