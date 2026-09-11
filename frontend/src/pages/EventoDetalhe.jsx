import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useConvidados } from '../hooks/useConvidados'
import Sidebar from '../components/Sidebar'

function EventoDetalhe() {
  const { id } = useParams()
  const { convidados, carregando, recarregar } = useConvidados(id)
  const [nomeConvidado, setNomeConvidado] = useState('')
  const [emailConvidado, setEmailConvidado] = useState('')

  const confirmados = convidados.filter((c) => c.status_presenca === 'CONFIRMADO').length
  const pendentes = convidados.filter((c) => c.status_presenca === 'PENDENTE').length
  const recusados = convidados.filter((c) => c.status_presenca === 'RECUSADO').length

  async function handleAdicionarConvidado(e) {
    e.preventDefault()
    if (!nomeConvidado) return

    const { error } = await supabase.from('convidado').insert({
      evento_id: id,
      nome: nomeConvidado,
      email: emailConvidado || null,
    })

    if (!error) {
      setNomeConvidado('')
      setEmailConvidado('')
      recarregar()
    }
  }

  function renderBadge(status) {
    if (status === 'CONFIRMADO') return <span className="badge badge-ok">Confirmado</span>
    if (status === 'RECUSADO') return <span className="badge badge-no">Recusado</span>
    return <span className="badge badge-pend">Pendente</span>
  }

  return (
    <div className="screen">
      <Sidebar />
      <div className="main">
        <div className="ev-header">
          <h2>Detalhe do evento</h2>
          <div className="meta">ID: {id}</div>
        </div>

        <div className="ev-tabs">
          <button className="tab-btn active">Convidados</button>
        </div>

        <div className="page-body">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{convidados.length}</div>
              <div className="stat-label">Total de convidados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{confirmados}</div>
              <div className="stat-label">Confirmados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{pendentes}</div>
              <div className="stat-label">Pendentes</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{recusados}</div>
                <div className="stat-label">Recusados</div>
            </div>
          </div>

          <form onSubmit={handleAdicionarConvidado} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Nome do convidado"
              value={nomeConvidado}
              onChange={(e) => setNomeConvidado(e.target.value)}
              style={{ flex: 1, padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
              required
            />
            <input
              type="email"
              placeholder="E-mail (opcional)"
              value={emailConvidado}
              onChange={(e) => setEmailConvidado(e.target.value)}
              style={{ flex: 1, padding: '9px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
            />
            <button type="submit" className="btn btn-primary">+ Adicionar</button>
          </form>

          {carregando ? (
            <p>Carregando...</p>
          ) : (
            <table className="gst-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {convidados.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>{c.email || '—'}</td>
                    <td>{renderBadge(c.status_presenca)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventoDetalhe