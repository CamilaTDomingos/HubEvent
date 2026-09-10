import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useEventos } from '../hooks/useEventos'
import Sidebar from '../components/Sidebar'
import ModalCriarEvento from '../components/ModalCriarEvento'

function Dashboard() {
  const { usuario } = useAuth()
  const { eventos, carregando, erro, recarregar } = useEventos()
  const [modalAberto, setModalAberto] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="screen">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
        <div className="page-body">
          <div className="hero-banner">
            <div className="hero-ey">Olá, {usuario?.email}</div>
            <h1>Organize cada detalhe.<br /><em>Celebre com leveza.</em></h1>
            <p className="hero-sub">
              Do casamento ao chá de bebê — convidados, presentes, checklist e orçamento em um só lugar.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => setModalAberto(true)}>
                Criar evento
              </button>
            </div>
          </div>

          <div className="sec-hd">
            <div>
              <h3>Meus eventos</h3>
              <div className="sub">
                {carregando
                  ? 'Carregando...'
                  : eventos.length === 0
                  ? 'Nenhum evento criado ainda'
                  : `${eventos.length} evento(s)`}
              </div>
            </div>
          </div>

          {erro && <p style={{ color: 'var(--red)' }}>{erro}</p>}

          {!carregando && eventos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r)',
                    padding: '18px',
                    background: 'var(--card)',
                  }}
                >
                  <h4 style={{ marginBottom: '6px' }}>{evento.nome}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                    {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModalCriarEvento
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoCriar={recarregar}
      />
    </div>
  )
}

export default Dashboard