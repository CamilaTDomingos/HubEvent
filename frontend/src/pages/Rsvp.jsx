import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Forma from '../components/Forma'
import Confete, { sortearConfete } from '../components/Confete'
import Carregando from '../components/Carregando'
import { tipoEvento } from '../utils/categorias'
import { dataLonga, hora } from '../utils/datas'
import './Rsvp.css'

function Rsvp() {
  const { convidadoId } = useParams()
  const [convite, setConvite] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [confete, setConfete] = useState(null)

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
      if (resposta === 'CONFIRMADO') setConfete(sortearConfete())
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) return <Carregando texto="Abrindo seu convite…" telaCheia />

  if (erro && !convite) {
    return (
      <div className="rsvp">
        <div className="rsvp-convite">
          <Forma tipo="blob" cor="var(--paper-3)" tamanho={80} contorno />
          <h1 className="display rsvp-evento">Ops.</h1>
          <p className="rsvp-texto">{erro} Confira se o link está completo.</p>
        </div>
      </div>
    )
  }

  const { evento } = convite
  const tipo = tipoEvento(evento.categoria)
  const horario = hora(evento.data_inicio)

  return (
    <div className="rsvp">
      <Forma tipo={tipo.forma} cor={tipo.cor} tamanho={340} contorno className="rsvp-deco rsvp-deco-a" />
      <Forma tipo="estrela" cor="var(--sun)" tamanho={120} contorno className="rsvp-deco rsvp-deco-b" />
      <Forma tipo="circulo" cor="var(--sky)" tamanho={70} contorno className="rsvp-deco rsvp-deco-c" />

      <main className="rsvp-convite">
        <p className="eyebrow rv">Você está convidado(a)</p>
        <p className="rsvp-ola display rv" style={{ '--d': 1 }}>Olá, <em>{convite.nome}.</em></p>
        <h1 className="display rsvp-evento rv" style={{ '--d': 2 }}>{evento.nome}</h1>

        <dl className="rsvp-detalhes rv" style={{ '--d': 3 }}>
          <div>
            <dt className="eyebrow">Quando</dt>
            <dd>{dataLonga(evento.data_inicio)}{horario && `, às ${horario}`}</dd>
          </div>
          {evento.local && (
            <div>
              <dt className="eyebrow">Onde</dt>
              <dd>{evento.local}</dd>
            </div>
          )}
        </dl>

        <div className="rsvp-resposta rv" style={{ '--d': 4 }}>
          {convite.status_presenca === 'PENDENTE' ? (
            <>
              <p className="rsvp-pergunta">Podemos contar com você?</p>
              <div className="rsvp-botoes">
                <button className="btn btn-primary btn-lg" disabled={enviando} onClick={() => responder('CONFIRMADO')}>
                  Confirmar presença
                </button>
                <button className="btn btn-ghost btn-lg" disabled={enviando} onClick={() => responder('RECUSADO')}>
                  Não poderei ir
                </button>
              </div>
              {erro && <p className="erro-msg">{erro}</p>}
            </>
          ) : convite.status_presenca === 'CONFIRMADO' ? (
            <div className="rsvp-final ok">
              <span className="rsvp-carimbo">✓</span>
              <p><strong>Presença confirmada.</strong> Obrigado — até lá!</p>
            </div>
          ) : (
            <div className="rsvp-final">
              <span className="rsvp-carimbo nao">✕</span>
              <p><strong>Resposta registrada.</strong> Que pena! Sentiremos sua falta.</p>
            </div>
          )}
        </div>
      </main>

      {confete && <Confete pedacos={confete} />}
      <p className="rsvp-marca mono">enviado com HubEvent</p>
    </div>
  )
}

export default Rsvp
