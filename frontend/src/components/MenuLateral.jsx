import { NavLink } from 'react-router-dom'
import Icone from './Icone'

const links = [
  { label: 'Início', path: '/dashboard', icone: 'casa' },
  { label: 'Meus eventos', path: '/eventos', icone: 'calendario' },
]

// Menu flutuante em pílula: ícones com rótulo que aparece ao passar o mouse.
function MenuLateral() {
  return (
    <nav className="menu-lateral" aria-label="Navegação principal">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) => `menu-item ${isActive ? 'ativo' : ''}`}
          aria-label={link.label}
        >
          <Icone nome={link.icone} tamanho={20} />
          <span className="menu-rotulo" aria-hidden="true">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default MenuLateral
