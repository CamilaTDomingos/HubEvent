import express from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

const router = express.Router()

// A página é pública: só sai daqui o que o próprio convidado precisa ver.
// Nada de e-mail, grupo ou dados de outros convidados.
const CAMPOS_CONVITE =
  'id, nome, status_presenca, acompanhantes_permitidos, acompanhantes_confirmados, evento:evento_id (nome, data_inicio, local, categoria)'

// Dá para responder (e mudar a resposta) até o evento começar.
function encerrado(evento, agora = new Date()) {
  return !evento?.data_inicio || new Date(evento.data_inicio) <= agora
}

// Busca os dados do convite (nome do convidado + nome/data do evento)
router.get('/:convidadoId', async (req, res) => {
  const { convidadoId } = req.params

  const { data, error } = await supabaseAdmin
    .from('convidado')
    .select(CAMPOS_CONVITE)
    .eq('id', convidadoId)
    .single()

  if (error) {
    return res.status(404).json({ error: 'Convite não encontrado.' })
  }

  res.json({ ...data, encerrado: encerrado(data.evento) })
})

// Confirma (com quantos acompanhantes) ou recusa presença. O limite de
// acompanhantes vem do banco, nunca do que a página mandou.
router.post('/:convidadoId', async (req, res) => {
  const { convidadoId } = req.params
  const { resposta } = req.body // 'CONFIRMADO' ou 'RECUSADO'

  if (!['CONFIRMADO', 'RECUSADO'].includes(resposta)) {
    return res.status(400).json({ error: 'Resposta inválida.' })
  }

  const { data: convite, error: erroBusca } = await supabaseAdmin
    .from('convidado')
    .select('acompanhantes_permitidos, evento:evento_id (data_inicio)')
    .eq('id', convidadoId)
    .single()

  if (erroBusca) {
    return res.status(404).json({ error: 'Convite não encontrado.' })
  }

  if (encerrado(convite.evento)) {
    return res.status(409).json({ error: 'O evento já começou: as respostas foram encerradas.' })
  }

  const limite = convite.acompanhantes_permitidos ?? 0
  const acompanhantes = resposta === 'CONFIRMADO' ? (req.body.acompanhantes ?? 0) : 0

  if (!Number.isInteger(acompanhantes) || acompanhantes < 0 || acompanhantes > limite) {
    return res.status(400).json({
      error: limite === 0
        ? 'Este convite é individual: não inclui acompanhantes.'
        : `Este convite permite até ${limite} ${limite === 1 ? 'acompanhante' : 'acompanhantes'}.`,
    })
  }

  const { error } = await supabaseAdmin
    .from('convidado')
    .update({
      status_presenca: resposta,
      acompanhantes_confirmados: acompanhantes,
      confirmado_em: new Date().toISOString(),
    })
    .eq('id', convidadoId)

  if (error) {
    // O organizador pode ter baixado o limite enquanto a página estava aberta.
    if (error.code === '23514') {
      return res.status(409).json({ error: 'O convite mudou. Recarregue a página e tente de novo.' })
    }
    return res.status(500).json({ error: error.message })
  }

  res.json({ sucesso: true, status_presenca: resposta, acompanhantes_confirmados: acompanhantes })
})

export default router
