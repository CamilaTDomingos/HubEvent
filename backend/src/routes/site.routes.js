import express from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

const router = express.Router()

// Página pública do evento: só responde para sites publicados e devolve
// apenas o que o convidado precisa ver.
router.get('/:slug', async (req, res) => {
  const { slug } = req.params

  const { data, error } = await supabaseAdmin
    .from('landing_page')
    .select('titulo, conteudo, evento:evento_id (id, nome, categoria, data_inicio, local)')
    .eq('slug', slug)
    .eq('ativa', true)
    .maybeSingle()

  if (error || !data) {
    return res.status(404).json({ error: 'Site não encontrado.' })
  }

  let conteudo = null
  try {
    conteudo = data.conteudo ? JSON.parse(data.conteudo) : null
  } catch {
    conteudo = null
  }

  res.json({ titulo: data.titulo, conteudo, evento: data.evento })
})

export default router
