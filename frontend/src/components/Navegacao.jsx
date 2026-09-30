import { Link, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { nomeDoUsuario } from '../utils/datas'
import { iniciais, tomAvatar } from '../utils/categorias'
import Forma from './Forma'

const links = [
  { label: 'Início', path: '/dashboard' },
  { label: 'Eventos', path: '/eventos' },
]

function Navegacao() {
  const { usuario } = useAuth()
  const nome = nomeDoUsuario(usuario)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <header className="mast">
      <div className="mast-inner">
        <Link to="/dashboard" className="mast-brand" aria-label="HubEvent, início">
          <Forma tipo="flor" cor="var(--tomato)" tamanho={24} />
          <span>HubEvent</span>
        </Link>

        <nav className="mast-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `mast-link ${isActive ? 'ativo' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mast-user">
          <span className="avatar" style={{ background: tomAvatar(nome) }} aria-hidden="true">
            {iniciais(nome)}
          </span>
          <span className="mast-user-nome">{nome}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navegacao
