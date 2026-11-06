// Gera o "Pix copia e cola" (BR Code estático do Banco Central) com valor.
// Funciona em qualquer app de banco, sem gateway de pagamento.

function campo(id, valor) {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

// Nome e cidade só aceitam ASCII no padrão EMV.
function limpar(texto, max) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, max).toUpperCase()
}

function crc16(texto) {
  let crc = 0xffff
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

export function pixCopiaECola({ chave, nome, cidade, valor }) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim())
  const corpo = [
    campo('00', '01'),
    campo('26', conta),
    campo('52', '0000'),
    campo('53', '986'),
    valor > 0 ? campo('54', Number(valor).toFixed(2)) : '',
    campo('58', 'BR'),
    campo('59', limpar(nome, 25) || 'RECEBEDOR'),
    campo('60', limpar(cidade, 15) || 'BRASIL'),
    campo('62', campo('05', '***')),
  ].join('')
  const semCrc = `${corpo}6304`
  return semCrc + crc16(semCrc)
}
