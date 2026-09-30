import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const CONTEUDO_PADRAO = {
  mensagem: 'Seja bem-vindo! Confirme sua presença abaixo.',
  cor: '#16a37a',
  recursos: {
    confirmarPresenca: true,
    listaPresentes: true,
    contadorRegressivo: false,
    galeriaFotos: false,
    mapaLocal: false,
  },
}

function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function useLandingPage(eventoId, nomeEvento) {
  const [landingPage, setLandingPage] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const buscar = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)

    const { data, error } = await supabase
      .from('landing_page')
      .select('*')
      .eq('evento_id', eventoId)
      .maybeSingle()

    if (!error && data) {
      setLandingPage({
        ...data,
        conteudoParsed: data.conteudo ? JSON.parse(data.conteudo) : CONTEUDO_PADRAO,
      })
    } else {
      setLandingPage(null)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarregando(false)
  }, [eventoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscar()
  }, [buscar])

  async function salvar({ titulo, ativa, conteudoParsed }) {
    const payload = {
      evento_id: eventoId,
      titulo,
      slug: gerarSlug(titulo || nomeEvento),
      conteudo: JSON.stringify(conteudoParsed),
      ativa,
    }

    if (landingPage) {
      const { error } = await supabase
        .from('landing_page')
        .update(payload)
        .eq('id', landingPage.id)
      if (!error) buscar()
      return error
    } else {
      const { error } = await supabase.from('landing_page').insert(payload)
      if (!error) buscar()
      return error
    }
  }

  return { landingPage, carregando, salvar, conteudoPadrao: CONTEUDO_PADRAO }
}