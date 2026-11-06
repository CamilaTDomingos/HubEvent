import express from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

const router = express.Router()

const FORMAS_PRESENTE = ['loja', 'pix', 'cartao']
const MODULOS_PADRAO = { presentes: true, site: true }

// Site publicado + evento. Usado por todas as rotas públicas abaixo.
async function buscarSite(slug) {
  const { data, error } = await supabaseAdmin
    .from('landing_page')
    .select('titulo, conteudo, evento:evento_id (id, nome, categoria, data_inicio, local, modulos, pix_chave, pix_nome, pix_cidade)')
    .eq('slug', slug)
    .eq('ativa', true)
    .maybeSingle()

  if (error || !data) return null
  return data
}

function listaAtiva(site) {
  return { ...MODULOS_PADRAO, ...site.evento.modulos }.presentes
}

// Página pública do evento: só responde para sites publicados e devolve
// apenas o que o convidado precisa ver.
router.get('/:slug', async (req, res) => {
  const site = await buscarSite(req.params.slug)
  if (!site) {
    return res.status(404).json({ error: 'Site não encontrado.' })
  }

  let conteudo = null
  try {
    conteudo = site.conteudo ? JSON.parse(site.conteudo) : null
  } catch {
    conteudo = null
  }

  const { id, nome, categoria, data_inicio, local, modulos } = site.evento
  res.json({ titulo: site.titulo, conteudo, evento: { id, nome, categoria, data_inicio, local, modulos } })
})

// Lista de presentes do site. Os nomes de quem reservou ficam só para o
// organizador; aqui vai apenas quantas unidades já foram reservadas.
router.get('/:slug/presentes', async (req, res) => {
  const site = await buscarSite(req.params.slug)
  if (!site || !listaAtiva(site)) {
    return res.status(404).json({ error: 'Lista de presentes não encontrada.' })
  }

  const { data, error } = await supabaseAdmin
    .from('lista_presentes')
    .select('id, nome, descricao, valor, categoria, quantidade, link, imagem_url, reserva_presente(count)')
    .eq('evento_id', site.evento.id)
    .order('criado_em')

  if (error) {
    return res.status(500).json({ error: 'Não foi possível carregar a lista.' })
  }

  const { pix_chave, pix_nome, pix_cidade } = site.evento
  res.json({
    presentes: data.map(({ reserva_presente, ...p }) => ({ ...p, reservadas: reserva_presente[0]?.count ?? 0 })),
    recebimento: pix_chave ? { chave: pix_chave, nome: pix_nome, cidade: pix_cidade } : null,
  })
})

// Reserva uma unidade. A função no banco trava o presente, então duas
// pessoas não ficam com a última unidade.
router.post('/:slug/presentes/:presenteId/reservar', async (req, res) => {
  const nome = String(req.body?.nome ?? '').trim()
  const forma = req.body?.forma

  if (!nome || nome.length > 100 || !FORMAS_PRESENTE.includes(forma)) {
    return res.status(400).json({ error: 'Dados da reserva inválidos.' })
  }

  const site = await buscarSite(req.params.slug)
  if (!site || !listaAtiva(site)) {
    return res.status(404).json({ error: 'Lista de presentes não encontrada.' })
  }

  // Garante que o presente é deste evento antes de reservar.
  const { data: presente } = await supabaseAdmin
    .from('lista_presentes')
    .select('id')
    .eq('id', req.params.presenteId)
    .eq('evento_id', site.evento.id)
    .maybeSingle()

  if (!presente) {
    return res.status(404).json({ error: 'Presente não encontrado.' })
  }

  const { data: reservou, error } = await supabaseAdmin.rpc('reservar_presente', {
    p_presente_id: presente.id,
    p_nome: nome,
    p_forma: forma,
  })

  if (error) {
    return res.status(500).json({ error: 'Não foi possível reservar agora.' })
  }
  if (!reservou) {
    return res.status(409).json({ error: 'Este presente já foi reservado.' })
  }

  res.json({ sucesso: true })
})

export default router
