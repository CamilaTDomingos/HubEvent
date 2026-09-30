import Forma from './Forma'

function Carregando({ texto = 'Carregando…', telaCheia = false }) {
  return (
    <div className={`carregando ${telaCheia ? 'carregando-tela' : ''}`} role="status">
      <Forma tipo="estrela" cor="var(--sun)" tamanho={28} contorno />
      {texto}
    </div>
  )
}

export default Carregando
