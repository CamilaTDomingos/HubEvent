// Etiqueta de categoria: fundo e ponto na cor escolhida pelo usuário,
// texto neutro para continuar legível com qualquer cor.
function SeloCategoria({ categoria, className = '' }) {
  if (!categoria) return null
  return (
    <span className={`selo-cat ${className}`} style={{ '--cat': categoria.cor }}>
      {categoria.nome}
    </span>
  )
}

export default SeloCategoria
