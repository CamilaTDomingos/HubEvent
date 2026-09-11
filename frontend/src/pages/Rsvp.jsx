import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function Rsvp() {
  const { convidadoId } = useParams()
  const [convite, setConvite] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    async function buscarConvite() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rsvp/${convidadoId}`)
        if (!res.ok) throw new Error('Convite não encontrado.')
        const data = await res.json()
        setConvite(data)
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }
    buscarConvite()
  }, [convidadoId])

  async function responder(resposta) {
    setEnviando(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rsvp/${convidadoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta }),
      })
      if (!res.ok) throw new Error('Não foi possível registrar sua resposta.')
      setConvite((atual) => ({ ...atual, status_presenca: resposta }))
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) return <p style={{ padding: 40 }}>Carregando convite...</p>
  if (erro) return <p style={{ padding: 40, color: 'var(--red)' }}>{erro}</p>

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: 32, textAlign: 'center' }}>
      <h1 style={{ marginBottom: 8 }}>{convite.evento.nome}</h1>
      <p style={{ color: 'var(--text-2)', marginBottom: 4 }}>
        {new Date(convite.evento.data_inicio).toLocaleDateString('pt-BR')}
      </p>
      {convite.evento.local && <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>{convite.evento.local}</p>}

      <p style={{ marginBottom: 24 }}>Olá, {convite.nome}! Você foi convidado(a).</p>

      {convite.status_presenca === 'PENDENTE' ? (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" disabled={enviando} onClick={() => responder('CONFIRMADO')}>
            Confirmar presença
          </button>
          <button className="btn btn-ghost" disabled={enviando} onClick={() => responder('RECUSADO')}>
            Não poderei ir
          </button>
        </div>
      ) : convite.status_presenca === 'CONFIRMADO' ? (
        <p style={{ color: 'var(--em)', fontWeight: 600 }}>Presença confirmada. Obrigado!</p>
      ) : (
        <p style={{ color: 'var(--text-2)', fontWeight: 600 }}>Você registrou que não poderá comparecer.</p>
      )}
    </div>
  )
}

export default Rsvp