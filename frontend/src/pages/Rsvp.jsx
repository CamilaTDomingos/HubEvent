import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Icone from '../components/Icone'
import Carregando from '../components/Carregando'
import Confete, { sortearConfete } from '../components/Confete'
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
  const [confete, setConfete] = useState(null)
  const [alterando, setAlterando] = useState(false)
  const [acompanhantes, setAcompanhantes] = useState(0)

  useEffect(() => {
    async function buscarConvite() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rsvp/${convidadoId}`)
        if (!res.ok) throw new Error('Convite não encontrado.')
        const data = await res.json()
        setConvite(data)
        setAcompanhantes(data.acompanhantes_confirmados ?? 0)
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }
    buscarConvite()
  }, [convidadoId])

  // O servidor confere o limite de acompanhantes; a página só ajuda.
  async function responder(resposta) {
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rsvp/${convidadoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta, acompanhantes: resposta === 'CONFIRMADO' ? acompanhantes : 0 }),
      })
      const corpo = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(corpo.error || 'Não foi possível registrar sua resposta.')
      setConvite((atual) => ({ ...atual, status_presenca: corpo.status_presenca, acompanhantes_confirmados: corpo.acompanhantes_confirmados }))
      setAcompanhantes(corpo.acompanhantes_confirmados)
      setAlterando(false)
      setAcabouDeResponder(true)
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
  const limite = convite.acompanhantes_permitidos ?? 0
  const levando = convite.acompanhantes_confirmados ?? 0
  const perguntando = !convite.encerrado && (convite.status_presenca === 'PENDENTE' || alterando)
  const podeAlterar = !convite.encerrado && !enviando

  function alterarResposta() {
    setAcompanhantes(levando)
    setAcabouDeResponder(false)
    setErro(null)
    setAlterando(true)
  }

  return (
    <div className="rsvp">
      {confete && <Confete pedacos={confete} />}
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
            {perguntando ? (
              <>
                <p className="rsvp-pergunta">Podemos contar com você?</p>
                {limite > 0 && (
                  <div className="rsvp-acomp">
                    <span id="rsvp-acomp-rotulo">Quantas pessoas vão com você?</span>
                    <div className="contador" role="group" aria-labelledby="rsvp-acomp-rotulo">
                      <button type="button" className="btn-icone" disabled={acompanhantes <= 0 || enviando} onClick={() => setAcompanhantes((n) => Math.max(0, n - 1))} aria-label="Menos um acompanhante">
                        <span aria-hidden="true">−</span>
                      </button>
                      <output className="num" aria-live="polite" data-testid="acompanhantes">{acompanhantes}</output>
                      <button type="button" className="btn-icone" disabled={acompanhantes >= limite || enviando} onClick={() => setAcompanhantes((n) => Math.min(limite, n + 1))} aria-label="Mais um acompanhante">
                        <Icone nome="mais" tamanho={15} />
                      </button>
                    </div>
                    <small>Seu convite inclui até {limite} {limite === 1 ? 'acompanhante' : 'acompanhantes'}.</small>
                  </div>
                )}
                <div className="rsvp-botoes">
                  <button className="btn btn-primary btn-lg" disabled={enviando} onClick={() => responder('CONFIRMADO')}>
                    <Icone nome="check" tamanho={16} /> Confirmar presença
                  </button>
                  <button className="btn btn-secondary btn-lg" disabled={enviando} onClick={() => responder('RECUSADO')}>
                    Não poderei ir
                  </button>
                </div>
                {alterando && (
                  <button className="link rsvp-cancelar" onClick={() => setAlterando(false)}>Manter a resposta anterior</button>
                )}
                {erro && <p className="erro-msg">{erro}</p>}
              </>
            ) : convite.status_presenca === 'CONFIRMADO' ? (
              <div className={`rsvp-final ok ${acabouDeResponder ? 'agora' : ''}`}>
                <span className="rsvp-final-icone"><Icone nome="check" tamanho={22} traco={2} /></span>
                <p>
                  <strong>Presença confirmada{levando > 0 && ` para você e mais ${levando} ${levando === 1 ? 'pessoa' : 'pessoas'}`}.</strong> Obrigado — nos vemos lá!
                </p>
              </div>
            ) : convite.status_presenca === 'RECUSADO' ? (
              <div className={`rsvp-final ${acabouDeResponder ? 'agora' : ''}`}>
                <span className="rsvp-final-icone"><Icone nome="mais" tamanho={22} style={{ rotate: '45deg' }} /></span>
                <p><strong>Resposta registrada.</strong> Que pena! Sentiremos sua falta.</p>
              </div>
            ) : (
              <div className="rsvp-final">
                <span className="rsvp-final-icone"><Icone nome="relogio" tamanho={22} /></span>
                <p><strong>As confirmações foram encerradas.</strong> Fale direto com o anfitrião.</p>
              </div>
            )}

            {!perguntando && convite.status_presenca !== 'PENDENTE' && podeAlterar && (
              <button className="btn btn-ghost btn-sm rsvp-alterar" onClick={alterarResposta}>
                <Icone nome="editar" tamanho={14} /> Alterar resposta
              </button>
            )}
          </div>
        </div>
      </main>

      <p className="rsvp-marca">Enviado com <strong>HubEvent</strong></p>
    </div>
  )
}

export default Rsvp
