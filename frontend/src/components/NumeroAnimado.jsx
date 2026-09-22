import { useEffect, useState } from 'react'

function NumeroAnimado({ valor, prefixo = '' }) {
  const [exibido, setExibido] = useState(0)

  useEffect(() => {
    const duracao = 700
    const inicio = performance.now()

    function passo(agora) {
      const progresso = Math.min((agora - inicio) / duracao, 1)
      const suavizado = 1 - Math.pow(1 - progresso, 3)
      setExibido(valor * suavizado)

      if (progresso < 1) requestAnimationFrame(passo)
    }

    const frame = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(frame)
  }, [valor])

  return (
    <span>
      {prefixo}
      {exibido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

export default NumeroAnimado