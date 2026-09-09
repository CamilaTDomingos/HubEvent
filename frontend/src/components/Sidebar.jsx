import { Link, useLocation } from 'react-router-dom'

const links = [
  { label: 'Início', path: '/dashboard' },
  { label: 'Meus eventos', path: '/eventos' },
  { label: 'Perfil', path: '/perfil' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <div className="sidebar">
      <div style={{ padding: '20px', fontWeight: 700, fontSize: '16px' }}>
        HubEvent
      </div>
      <nav style={{ padding: '0 12px' }}>
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              display: 'block',
              padding: '10px 12px',
              borderRadius: 'var(--r-sm)',
              marginBottom: '4px',
              color: location.pathname === link.path ? 'var(--em)' : 'var(--text-2)',
              background: location.pathname === link.path ? 'var(--em-dim)' : 'transparent',
              fontWeight: 500,
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar