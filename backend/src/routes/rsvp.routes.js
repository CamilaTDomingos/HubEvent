import express from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

const router = express.Router()

// Busca os dados do convite (nome do convidado + nome/data do evento)
router.get('/:convidadoId', async (req, res) => {
  const { convidadoId } = req.params

  const { data, error } = await supabaseAdmin
    .from('convidado')
    .select('id, nome, status_presenca, evento:evento_id (nome, data_inicio, local)')
    .eq('id', convidadoId)
    .single()

  if (error) {
    return res.status(404).json({ error: 'Convite não encontrado.' })
  }

  res.json(data)
})

// Confirma ou recusa presença
router.post('/:convidadoId', async (req, res) => {
  const { convidadoId } = req.params
  const { resposta } = req.body // 'CONFIRMADO' ou 'RECUSADO'

  if (!['CONFIRMADO', 'RECUSADO'].includes(resposta)) {
    return res.status(400).json({ error: 'Resposta inválida.' })
  }

  const { error } = await supabaseAdmin
    .from('convidado')
    .update({
      status_presenca: resposta,
      confirmado_em: new Date().toISOString(),
    })
    .eq('id', convidadoId)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ sucesso: true })
})

export default router