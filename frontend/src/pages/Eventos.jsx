import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventos } from '../hooks/useEventos'
import Sidebar from '../components/Sidebar'
import ModalCriarEvento from '../components/ModalCriarEvento'

function Eventos() {
  const { eventos, carregando, recarregar } = useEventos()
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const navigate = useNavigate()

  const eventosFiltrados = eventos.filter((evento) =>
    evento.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="screen">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">Meus eventos</div>
          <div className="topbar-search">
            <input
              placeholder="Buscar evento..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary btn-sm" onClick={() => setModalAberto(true)}>
              + Novo evento
            </button>
          </div>
        </div>

        <div className="page-body">
          {carregando ? (
            <p>Carregando...</p>
          ) : (
            <div className="ev-grid">
              {eventosFiltrados.map((evento) => (
                <div
                  key={evento.id}
                  className="ev-card"
                  onClick={() => navigate(`/eventos/${evento.id}`)}
                >
                  <div className="ev-card-banner">
                    {evento.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="ev-card-body">
                    <div className="ev-card-name">{evento.nome}</div>
                    <div className="ev-card-date">
                      {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
                    </div>
                    {evento.categoria && (
                      <span className="ev-card-cat">{evento.categoria}</span>
                    )}
                  </div>
                </div>
              ))}

              <div className="ev-add" onClick={() => setModalAberto(true)}>
                <div className="ev-add-lbl">+ Criar novo evento</div>
              </div>
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

export default Eventos