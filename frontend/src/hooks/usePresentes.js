import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { importarPresentes } from '../lib/importarDadosLocais'

// Lista de presentes. O organizador lê e grava direto no Supabase (com RLS);
// o site público passa pelo backend, que esconde quem reservou e faz a
// reserva de forma atômica.

const BUCKET = 'presentes'

export const FORMAS_PRESENTE = {
  loja: 'Comprou na loja',
  pix: 'Pix',
  cartao: 'Cartão',
}

export function esgotado(presente) {
  return presente.reservas.length >= presente.quantidade
}

function doBanco(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    descricao: linha.descricao,
    valor: linha.valor === null ? null : Number(linha.valor),
    categoria: linha.categoria,
    quantidade: linha.quantidade,
    link: linha.link,
    imagem: linha.imagem_url,
    reservas: (linha.reserva_presente || [])
      .map((r) => ({ id: r.id, nome: r.nome, forma: r.forma, em: r.criado_em }))
      .sort((a, b) => a.em.localeCompare(b.em)),
  }
}

// A foto chega do formulário como data URL (já comprimida); vai para o Storage
// e no banco fica só o endereço público.
async function enviarFoto(eventoId, imagem) {
  if (!imagem || !imagem.startsWith('data:')) return imagem
  const blob = await (await fetch(imagem)).blob()
  const caminho = `${eventoId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, { contentType: blob.type || 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl
}

// Apaga a foto antiga quando ela é trocada ou o presente sai da lista.
// Falhar aqui não impede a operação: no máximo sobra um arquivo no bucket.
async function apagarFoto(url) {
  const marcador = `/object/public/${BUCKET}/`
  const i = url?.indexOf(marcador) ?? -1
  if (i < 0) return
  await supabase.storage.from(BUCKET).remove([url.slice(i + marcador.length)])
}

function paraBanco(dados) {
  return {
    nome: dados.nome,
    descricao: dados.descricao,
    valor: dados.valor,
    categoria: dados.categoria,
    quantidade: dados.quantidade,
    link: dados.link,
  }
}

export function usePresentes(eventoId) {
  const [presentes, setPresentes] = useState([])
  const [recebimento, setRecebimento] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarPresentes = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    await importarPresentes(eventoId)

    const [lista, evento] = await Promise.all([
      supabase
        .from('lista_presentes')
        .select('*, reserva_presente(id, nome, forma, criado_em)')
        .eq('evento_id', eventoId)
        .order('criado_em'),
      supabase.from('evento').select('pix_chave, pix_nome, pix_cidade').eq('id', eventoId).single(),
    ])

    if (lista.error) {
      setErro('Não foi possível carregar a lista de presentes.')
    } else {
      setErro(null)
      setPresentes(lista.data.map(doBanco))
    }

    const pix = evento.data
    setRecebimento(pix?.pix_chave ? { chave: pix.pix_chave, nome: pix.pix_nome, cidade: pix.pix_cidade || '' } : null)
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarPresentes()
  }, [buscarPresentes])

  // Devolve true/false para o formulário saber se pode fechar.
  const executar = useCallback(
    async (operacao, mensagem) => {
      try {
        await operacao()
        setErro(null)
        await buscarPresentes()
        return true
      } catch {
        setErro(mensagem)
        return false
      }
    },
    [buscarPresentes]
  )

  const cadastrar = useCallback(
    (dados) =>
      executar(async () => {
        const imagem_url = await enviarFoto(eventoId, dados.imagem)
        const { error } = await supabase.from('lista_presentes').insert({ ...paraBanco(dados), evento_id: eventoId, imagem_url })
        if (error) throw error
      }, 'Não foi possível cadastrar o presente.'),
    [eventoId, executar]
  )

  // Reservas não passam pelo formulário, então nunca são alteradas aqui.
  const editar = useCallback(
    (presenteId, dados) =>
      executar(async () => {
        const anterior = presentes.find((p) => p.id === presenteId)
        const imagem_url = await enviarFoto(eventoId, dados.imagem)
        const { error } = await supabase.from('lista_presentes').update({ ...paraBanco(dados), imagem_url }).eq('id', presenteId)
        if (error) throw error
        if (anterior?.imagem && anterior.imagem !== imagem_url) await apagarFoto(anterior.imagem).catch(() => {})
      }, 'Não foi possível salvar as alterações.'),
    [eventoId, presentes, executar]
  )

  const remover = useCallback(
    (presenteId) =>
      executar(async () => {
        const anterior = presentes.find((p) => p.id === presenteId)
        const { error } = await supabase.from('lista_presentes').delete().eq('id', presenteId)
        if (error) throw error
        if (anterior?.imagem) await apagarFoto(anterior.imagem).catch(() => {})
      }, 'Não foi possível remover o presente.'),
    [presentes, executar]
  )

  const salvarRecebimento = useCallback(
    async (dados) => {
      const { error } = await supabase
        .from('evento')
        .update({ pix_chave: dados.chave, pix_nome: dados.nome, pix_cidade: dados.cidade || null })
        .eq('id', eventoId)
      if (error) {
        setErro('Não foi possível salvar a chave Pix.')
        return false
      }
      setRecebimento(dados)
      return true
    },
    [eventoId]
  )

  return { presentes, carregando, erro, recarregar: buscarPresentes, cadastrar, editar, remover, recebimento, salvarRecebimento }
}

// Versão do site público: lê pelo backend e reserva por lá.
export function usePresentesSite(slug) {
  const [presentes, setPresentes] = useState([])
  const [recebimento, setRecebimento] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const api = `${import.meta.env.VITE_API_URL}/api/site/${slug}/presentes`

  const buscar = useCallback(async () => {
    try {
      const res = await fetch(api)
      if (!res.ok) throw new Error()
      const dados = await res.json()
      // O site só precisa saber quantas unidades já foram; os nomes não vêm.
      setPresentes(
        dados.presentes.map(({ reservadas, imagem_url, valor, ...p }) => ({
          ...p,
          valor: valor === null ? null : Number(valor),
          imagem: imagem_url,
          reservas: Array.from({ length: reservadas }, () => ({})),
        }))
      )
      setRecebimento(dados.recebimento)
    } catch {
      setPresentes([])
    } finally {
      setCarregando(false)
    }
  }, [api])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscar()
  }, [buscar])

  // Devolve true, 'esgotado' (alguém levou a última unidade antes) ou 'erro'.
  const reservar = useCallback(
    async (presenteId, { nome, forma }) => {
      try {
        const res = await fetch(`${api}/${presenteId}/reservar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, forma }),
        })
        if (res.ok) return true
        return res.status === 409 ? 'esgotado' : 'erro'
      } catch {
        return 'erro'
      } finally {
        buscar()
      }
    },
    [api, buscar]
  )

  return { presentes, carregando, reservar, recebimento }
}
