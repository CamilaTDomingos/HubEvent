import LayoutApp from '../components/LayoutApp'
import GerenciarCategorias from '../components/GerenciarCategorias'
import './Perfil.css'

function Perfil() {
  return (
    <LayoutApp>
      <header className="cab">
        <div className="rv">
          <p className="eyebrow">Sua conta</p>
          <h1 className="titulo">Perfil</h1>
        </div>
      </header>

      <div className="perfil-grade">
        <GerenciarCategorias />
      </div>
    </LayoutApp>
  )
}

export default Perfil
