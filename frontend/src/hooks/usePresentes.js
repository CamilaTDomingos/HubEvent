import { useEffect, useState, useCallback } from 'react'
import { ler, gravar } from '../lib/armazemLocal'

// Lista de presentes com dados mockados. A tabela `lista_presentes` ainda não
// tem foto, quantidade, link e reservas; até ter, os itens ficam no navegador
// (localStorage), por evento. Painel do casal e site do evento leem o mesmo
// armazenamento, então uma reserva feita no site aparece no painel.
// A troca pelo Supabase fica restrita a este arquivo.

const ATRASO_MS = 450

const busca = (termo) => `https://www.amazon.com.br/s?k=${encodeURIComponent(termo)}`

const SEMENTE = [
  { nome: 'Jogo de taças de cristal', valor: 249.9, categoria: 'Mesa posta', quantidade: 1, reservas: [], link: busca('jogo de taças de cristal'), descricao: 'Seis taças para vinho tinto, em cristal lapidado.' },
  { nome: 'Jogo de cama queen', valor: 389.9, categoria: 'Cama e banho', quantidade: 1, reservas: [{ nome: 'Tia Marta', forma: 'pix' }], descricao: 'Percal 400 fios, em tons claros.' },
  { nome: 'Cafeteira', valor: 699, categoria: 'Eletroportáteis', quantidade: 1, reservas: [], link: busca('cafeteira espresso'), descricao: 'Cafeteira espresso com vaporizador de leite.' },
  { nome: 'Air fryer', valor: 549.9, categoria: 'Eletroportáteis', quantidade: 1, reservas: [{ nome: 'Carlos e Júlia', forma: 'loja' }], link: busca('air fryer 5 litros'), descricao: 'Capacidade de 5 litros, com cesto antiaderente.' },
  { nome: 'Conjunto de panelas', valor: 799, categoria: 'Cozinha', quantidade: 1, reservas: [], descricao: 'Cinco peças em inox com fundo triplo.' },
  { nome: 'Toalhas de banho', valor: 89.9, categoria: 'Cama e banho', quantidade: 4, reservas: [{ nome: 'Família Souza', forma: 'cartao' }, { nome: 'Renata', forma: 'pix' }, { nome: 'Paulo', forma: 'pix' }], descricao: 'Toalhas de algodão egípcio, 70 × 140 cm.' },
  { nome: 'Pratos de sobremesa', valor: 159, categoria: 'Mesa posta', quantidade: 2, reservas: [{ nome: 'Renata', forma: 'loja' }], link: busca('pratos de sobremesa porcelana'), descricao: 'Jogo com seis pratos de porcelana branca.' },
  { nome: 'Vaso de cerâmica', valor: 179.9, categoria: 'Casa e decoração', quantidade: 1, reservas: [], descricao: 'Peça artesanal em cerâmica esmaltada.' },
]

export const FORMAS_PRESENTE = {
  loja: 'Comprou na loja',
  pix: 'Pix',
  cartao: 'Cartão',
}

const chaveItens = (eventoId) => `hubevent:presentes:${eventoId}`
const chaveRecebimento = (eventoId) => `hubevent:recebimento:${eventoId}`

export function esgotado(presente) {
  return presente.reservas.length >= presente.quantidade
}

function itensDoEvento(eventoId) {
  const salvos = ler(chaveItens(eventoId), null)
  if (salvos) return salvos
  const iniciais = SEMENTE.map((p, i) => ({ id: `${eventoId}-${i}`, imagem: null, link: null, ...p }))
  gravar(chaveItens(eventoId), iniciais)
  return iniciais
}

export function usePresentes(eventoId) {
  const [presentes, setPresentes] = useState([])
  const [recebimento, setRecebimento] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarPresentes = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    await new Promise((r) => setTimeout(r, ATRASO_MS))
    setPresentes(itensDoEvento(eventoId))
    setRecebimento(ler(chaveRecebimento(eventoId), null))
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarPresentes()
  }, [buscarPresentes])

  // Mantém painel e site sincronizados quando estão abertos em abas diferentes.
  useEffect(() => {
    function aoMudar(e) {
      if (e.key === chaveItens(eventoId)) setPresentes(itensDoEvento(eventoId))
      if (e.key === chaveRecebimento(eventoId)) setRecebimento(ler(chaveRecebimento(eventoId), null))
    }
    window.addEventListener('storage', aoMudar)
    return () => window.removeEventListener('storage', aoMudar)
  }, [eventoId])

  const salvar = useCallback(
    (itens) => {
      if (!gravar(chaveItens(eventoId), itens)) {
        setErro('Não foi possível salvar. O armazenamento do navegador pode estar cheio — tente uma foto menor.')
        return false
      }
      setErro(null)
      setPresentes(itens)
      return true
    },
    [eventoId]
  )

  const cadastrar = useCallback(
    (dados) => salvar([...itensDoEvento(eventoId), { id: crypto.randomUUID(), reservas: [], ...dados }]),
    [eventoId, salvar]
  )

  // Reserva uma unidade; o item só aparece como reservado quando todas forem.
  const reservar = useCallback(
    (presenteId, { nome, forma }) => {
      const itens = itensDoEvento(eventoId)
      const alvo = itens.find((p) => p.id === presenteId)
      if (!alvo || esgotado(alvo)) return false
      return salvar(
        itens.map((p) =>
          p.id === presenteId ? { ...p, reservas: [...p.reservas, { nome, forma, em: new Date().toISOString() }] } : p
        )
      )
    },
    [eventoId, salvar]
  )

  // Reservas não passam pelo formulário, então nunca são sobrescritas aqui.
  const editar = useCallback(
    (presenteId, dados) =>
      salvar(itensDoEvento(eventoId).map((p) => (p.id === presenteId ? { ...p, ...dados, reservas: p.reservas } : p))),
    [eventoId, salvar]
  )

  const remover = useCallback(
    (presenteId) => salvar(itensDoEvento(eventoId).filter((p) => p.id !== presenteId)),
    [eventoId, salvar]
  )

  const salvarRecebimento = useCallback(
    (dados) => {
      if (gravar(chaveRecebimento(eventoId), dados)) setRecebimento(dados)
    },
    [eventoId]
  )

  return { presentes, carregando, erro, recarregar: buscarPresentes, cadastrar, editar, reservar, remover, recebimento, salvarRecebimento }
}
