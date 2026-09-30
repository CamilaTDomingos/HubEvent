import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEventos } from '../hooks/useEventos'
import LayoutApp from '../components/LayoutApp'
import ModalCriarEvento from '../components/ModalCriarEvento'
import SeloNovoEvento from '../components/SeloNovoEvento'
import EventoLinha from '../components/EventoLinha'
import Forma from '../components/Forma'
import Carregando from '../components/Carregando'
import NumeroAnimado from '../components/NumeroAnimado'
import { tipoEvento } from '../utils/categorias'
import { saudacao, nomeDoUsuario, diasAte, dataLonga, hora, formatar } from '../utils/datas'
import './Dashboard.css'

function fraseResumo(futuros, diasProximo) {
  if (futuros.length === 0) return <>Nenhum evento pela frente. Que tal planejar o próximo?</>
  const quando =
    diasProximo === 0 ? 'é hoje' : diasProximo === 1 ? 'é amanhã' : `é daqui a ${diasProximo} dias`
  return (
    <>
      Você tem <strong>{futuros.length} {futuros.length === 1 ? 'evento' : 'eventos'}</strong> pela frente — o próximo{' '}
      <strong>{quando}</strong>.
    </>
  )
}

function Dashboard() {
  const { usuario } = useAuth()
  const { eventos, carregando, erro, recarregar } = useEventos()
  const [modalAberto, setModalAberto] = useState(false)

  const futuros = eventos.filter((e) => diasAte(e.data_inicio) >= 0)
  const proximo = futuros[0]
  const diasProximo = proximo ? diasAte(proximo.data_inicio) : null
  const seguintes = futuros.slice(1, 6)
  const tipoProximo = proximo ? tipoEvento(proximo.categoria) : null

  return (
    <LayoutApp>
      <section className="dash-topo">
        <div>
          <p className="eyebrow rv">{formatar(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="display dash-ola rv" style={{ '--d': 1 }}>
            {saudacao()},<br />
            <em>{nomeDoUsuario(usuario)}.</em>
          </h1>
          {!carregando && eventos.length > 0 && (
            <p className="dash-resumo rv" style={{ '--d': 2 }}>{fraseResumo(futuros, diasProximo)}</p>
          )}
        </div>
        <SeloNovoEvento className="rv" onClick={() => setModalAberto(true)} />
      </section>

      {erro && <p className="erro-msg">{erro}</p>}

      {carregando ? (
        <Carregando texto="Buscando seus eventos…" />
      ) : eventos.length === 0 ? (
        <section className="vazio rv" style={{ '--d': 2 }}>
          <div className="vazio-formas" aria-hidden="true">
            <Forma tipo="flor" cor="var(--lilac)" tamanho={130} contorno style={{ left: 0, top: 10 }} />
            <Forma tipo="estrela" cor="var(--sun)" tamanho={80} contorno style={{ left: 110, top: 0 }} />
            <Forma tipo="circulo" cor="var(--sky)" tamanho={56} contorno style={{ left: 120, top: 110 }} />
          </div>
          <div>
            <h2 className="display">A agenda está <em>em branco.</em></h2>
            <p>Casamento, aniversário, chá de bebê ou a festa da firma: crie o primeiro evento e a gente organiza o resto com você.</p>
            <button className="btn btn-primary btn-lg" onClick={() => setModalAberto(true)}>
              Criar meu primeiro evento →
            </button>
          </div>
        </section>
      ) : (
        <>
          {proximo && (
            <Link to={`/eventos/${proximo.id}`} className="destaque rv" style={{ '--d': 3 }}>
              <div className="destaque-num">
                <Forma tipo={tipoProximo.forma} cor={tipoProximo.cor} />
                {diasProximo === 0 ? (
                  <span className="destaque-dias hoje">hoje!</span>
                ) : (
                  <>
                    <span className="destaque-dias">
                      <NumeroAnimado valor={diasProximo} casas={0} duracao={900} />
                    </span>
                    <span className="destaque-unid">{diasProximo === 1 ? 'dia' : 'dias'}</span>
                  </>
                )}
              </div>
              <div className="destaque-info">
                <p className="eyebrow">Próximo evento · {proximo.categoria || 'Evento'}</p>
                <h2 className="display">{proximo.nome}</h2>
                <p className="destaque-meta">
                  {dataLonga(proximo.data_inicio)}
                  {hora(proximo.data_inicio) && ` · ${hora(proximo.data_inicio)}`}
                  {proximo.local && <><br />{proximo.local}</>}
                </p>
                <span className="destaque-cta">Abrir evento <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          )}

          {(seguintes.length > 0 || !proximo) && (
            <section className="rv" style={{ '--d': 4 }}>
              <div className="sec-titulo">
                <h3>{proximo ? 'Na sequência' : 'Seus eventos'}</h3>
                <Link to="/eventos" className="link mono">ver agenda completa →</Link>
              </div>
              <ul className="ev-lista">
                {(proximo ? seguintes : eventos.slice(-5).reverse()).map((evento, i) => (
                  <EventoLinha key={evento.id} evento={evento} indice={i} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <ModalCriarEvento
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoCriar={recarregar}
      />
    </LayoutApp>
  )
}

export default Dashboard
