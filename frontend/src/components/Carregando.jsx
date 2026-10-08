function Carregando({ texto = 'Carregando…', telaCheia = false }) {
  return (
    <div className={`carregando ${telaCheia ? 'carregando-tela' : ''}`} role="status">
      <span className="carregando-anel" aria-hidden="true" />
      {texto}
    </div>
  )
}

export default Carregando
