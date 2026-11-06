// Cálculos da lista de convidados (RF04). Convidados de antes da migração
// não têm as colunas de acompanhantes e envio: contam como convite
// individual e "não enviado" até alguém responder.

export const MAX_ACOMPANHANTES = 20

export const acompanhantesPermitidos = (c) => c.acompanhantes_permitidos ?? 0
export const acompanhantesConfirmados = (c) => (c.status_presenca === 'CONFIRMADO' ? c.acompanhantes_confirmados ?? 0 : 0)

// Quem já respondeu recebeu o convite, mesmo sem data de envio.
export const foiEnviado = (c) => Boolean(c.enviado_em) || c.status_presenca !== 'PENDENTE'

export function resumoConvidados(convidados) {
  const resumo = {
    total: convidados.length,
    confirmados: 0,
    pendentes: 0,
    recusados: 0,
    enviados: 0,
    naoEnviados: 0,
    acompanhantes: 0,
    // Titulares confirmados + acompanhantes: o número para buffet e bebidas.
    pessoasConfirmadas: 0,
    // Se todos os pendentes vierem com todos os acompanhantes permitidos.
    pessoasPossiveis: 0,
  }

  for (const c of convidados) {
    if (foiEnviado(c)) resumo.enviados++
    else resumo.naoEnviados++

    if (c.status_presenca === 'CONFIRMADO') {
      resumo.confirmados++
      resumo.acompanhantes += acompanhantesConfirmados(c)
    } else if (c.status_presenca === 'RECUSADO') {
      resumo.recusados++
    } else {
      resumo.pendentes++
      resumo.pessoasPossiveis += 1 + acompanhantesPermitidos(c)
    }
  }

  resumo.pessoasConfirmadas = resumo.confirmados + resumo.acompanhantes
  resumo.pessoasPossiveis += resumo.pessoasConfirmadas
  return resumo
}

// Sem acento e sem diferença de maiúsculas: "joao" acha "João".
export const normalizarBusca = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function buscarConvidados(convidados, termo) {
  const busca = normalizarBusca(termo)
  if (!busca) return convidados
  return convidados.filter((c) => normalizarBusca(c.nome).includes(busca) || normalizarBusca(c.email || '').includes(busca))
}
