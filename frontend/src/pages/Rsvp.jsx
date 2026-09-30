import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Icone from '../components/Icone'
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
  const [acabouDeResponder, setAcabouDeResponder] = useState(false)

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
      setAcabouDeResponder(true)
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
        <div className="rsvp-cartao painel">
          <span className="rsvp-icone"><Icone nome="brilho" tamanho={22} /></span>
          <h1 className="titulo rsvp-evento">Convite não encontrado</h1>
          <p className="rsvp-texto">{erro} Confira se o link está completo ou peça um novo ao anfitrião.</p>
        </div>
      </div>
    )
  }

  const { evento } = convite
  const tipo = tipoEvento(evento.categoria)
  const horario = hora(evento.data_inicio)

  return (
    <div className="rsvp">
      <main className="rsvp-cartao painel rv">
        <div className="rsvp-interno">
          <span className="rsvp-icone"><Icone nome={tipo.icone} tamanho={22} /></span>
          <p className="eyebrow">Você está convidado(a)</p>
          <p className="rsvp-ola">Olá, {convite.nome}</p>
          <h1 className="titulo rsvp-evento">{evento.nome}</h1>

          <div className="ornamento" aria-hidden="true">✦</div>

          <ul className="rsvp-detalhes">
            <li>
              <Icone nome="calendario" tamanho={17} />
              <span className="capitalizar">{dataLonga(evento.data_inicio)}</span>
            </li>
            {horario && (
              <li><Icone nome="relogio" tamanho={17} /><span>{horario}</span></li>
            )}
            {evento.local && (
              <li><Icone nome="local" tamanho={17} /><span>{evento.local}</span></li>
            )}
          </ul>

          <div className="rsvp-resposta">
            {convite.status_presenca === 'PENDENTE' ? (
              <>
                <p className="rsvp-pergunta">Podemos contar com você?</p>
                <div className="rsvp-botoes">
                  <button className="btn btn-primary btn-lg" disabled={enviando} onClick={() => responder('CONFIRMADO')}>
                    <Icone nome="check" tamanho={16} /> Confirmar presença
                  </button>
                  <button className="btn btn-secondary btn-lg" disabled={enviando} onClick={() => responder('RECUSADO')}>
                    Não poderei ir
                  </button>
                </div>
                {erro && <p className="erro-msg">{erro}</p>}
              </>
            ) : convite.status_presenca === 'CONFIRMADO' ? (
              <div className={`rsvp-final ok ${acabouDeResponder ? 'agora' : ''}`}>
                <span className="rsvp-final-icone"><Icone nome="check" tamanho={22} traco={2} /></span>
                <p><strong>Presença confirmada.</strong> Obrigado — nos vemos lá!</p>
              </div>
            ) : (
              <div className={`rsvp-final ${acabouDeResponder ? 'agora' : ''}`}>
                <span className="rsvp-final-icone"><Icone nome="mais" tamanho={22} style={{ rotate: '45deg' }} /></span>
                <p><strong>Resposta registrada.</strong> Que pena! Sentiremos sua falta.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <p className="rsvp-marca">Enviado com <strong>HubEvent</strong></p>
    </div>
  )
}

export default Rsvp
