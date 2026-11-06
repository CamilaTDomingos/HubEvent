import { useEffect, useState } from 'react'

function NumeroAnimado({ valor, prefixo = '', casas = 2, duracao = 700 }) {
  const [exibido, setExibido] = useState(0)

  useEffect(() => {
    const inicio = performance.now()
    let frame

    function passo(agora) {
      const progresso = Math.min((agora - inicio) / duracao, 1)
      const suavizado = 1 - Math.pow(1 - progresso, 3)
      setExibido(valor * suavizado)

      if (progresso < 1) frame = requestAnimationFrame(passo)
    }

    frame = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(frame)
  }, [valor, duracao])

  return (
    <span className="num">
      {prefixo}
      {exibido.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}
    </span>
  )
}

export default NumeroAnimado
