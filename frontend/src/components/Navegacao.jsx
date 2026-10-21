import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { nomeDoUsuario } from '../utils/datas'
import { iniciais } from '../utils/categorias'
import Icone from './Icone'

function Navegacao() {
  const { usuario } = useAuth()
  const nome = nomeDoUsuario(usuario)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <header className="mast">
      <div className="mast-inner">
        <Link to="/dashboard" className="marca" aria-label="HubEvent, início">
          <span className="marca-simbolo"><Icone nome="brilho" tamanho={15} traco={1.8} /></span>
          <span className="marca-texto">HubEvent</span>
        </Link>

        <span className="mast-espaco" />

        <div className="mast-user">
          <span className="avatar" aria-hidden="true">{iniciais(nome)}</span>
          <span className="mast-user-nome">{nome}</span>
          <button className="btn-icone" onClick={handleLogout} title="Sair" aria-label="Sair">
            <Icone nome="sair" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navegacao
