import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEventos } from '../hooks/useEventos'
import LayoutApp from '../components/LayoutApp'
import ModalCriarEvento from '../components/ModalCriarEvento'
import EventoLinha from '../components/EventoLinha'
import Icone from '../components/Icone'
import Carregando from '../components/Carregando'
import NumeroAnimado from '../components/NumeroAnimado'
import { tipoEvento } from '../utils/categorias'
import { saudacao, nomeDoUsuario, diasAte, dataLonga, hora, formatar } from '../utils/datas'
import './Dashboard.css'

function fraseResumo(futuros, diasProximo) {
  if (futuros.length === 0) return 'Nenhum evento pela frente por enquanto.'
  const quando = diasProximo === 0 ? 'é hoje' : diasProximo === 1 ? 'é amanhã' : `acontece em ${diasProximo} dias`
  return `Você tem ${futuros.length} ${futuros.length === 1 ? 'evento' : 'eventos'} pela frente — o próximo ${quando}.`
}

function Dashboard() {
  const { usuario } = useAuth()
  const { eventos, carregando, erro, recarregar } = useEventos()
  const [modalAberto, setModalAberto] = useState(false)

  const futuros = eventos.filter((e) => diasAte(e.data_inicio) >= 0)
  const proximo = futuros[0]
  const diasProximo = proximo ? diasAte(proximo.data_inicio) : null
  const seguintes = futuros.slice(1, 6)
  const passados = eventos.length - futuros.length
  const emBreve = futuros.filter((e) => diasAte(e.data_inicio) <= 30).length

  return (
    <LayoutApp>
      <header className="cab">
        <div className="rv">
          <p className="eyebrow">{formatar(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="titulo">
            {saudacao()}, <em>{nomeDoUsuario(usuario)}</em>
          </h1>
          {!carregando && eventos.length > 0 && <p className="cab-sub">{fraseResumo(futuros, diasProximo)}</p>}
        </div>
        <button className="btn btn-primary rv" style={{ '--d': 1 }} onClick={() => setModalAberto(true)}>
          <Icone nome="mais" tamanho={16} /> Novo evento
        </button>
      </header>

      {erro && <p className="erro-msg">{erro}</p>}

      {carregando ? (
        <Carregando texto="Buscando seus eventos…" />
      ) : eventos.length === 0 ? (
        <section className="vazio painel rv" style={{ '--d': 2 }}>
          <span className="vazio-icone"><Icone nome="calendario" tamanho={26} /></span>
          <h2 className="titulo">Sua agenda está <em>em branco</em></h2>
          <p>Casamento, aniversário, chá de bebê ou a festa da empresa: crie o primeiro evento e organize tudo em um só lugar.</p>
          <button className="btn btn-primary" onClick={() => setModalAberto(true)}>
            <Icone nome="mais" tamanho={16} /> Criar meu primeiro evento
          </button>
        </section>
      ) : (
        <>
          {proximo && (
            <Link to={`/eventos/${proximo.id}`} className="proximo painel rv" style={{ '--d': 2 }}>
              <svg className="proximo-aneis" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="200" cy="0" r="70" />
                <circle cx="200" cy="0" r="110" />
                <circle cx="200" cy="0" r="150" />
              </svg>

              <div className="proximo-contagem">
                {diasProximo === 0 ? (
                  <strong className="titulo">Hoje</strong>
                ) : (
                  <strong className="titulo num">
                    <NumeroAnimado valor={diasProximo} casas={0} duracao={800} />
                  </strong>
                )}
                <span className="proximo-rotulo">{diasProximo === 0 ? 'é o grande dia' : diasProximo === 1 ? 'dia para o evento' : 'dias para o evento'}</span>
              </div>

              <div className="proximo-info">
                <p className="eyebrow proximo-tipo">
                  <Icone nome={tipoEvento(proximo.categoria).icone} tamanho={14} />
                  Próximo evento · {proximo.categoria || 'Evento'}
                </p>
                <h2 className="titulo">{proximo.nome}</h2>
                <ul className="meta-icones">
                  <li>
                    <Icone nome="calendario" tamanho={15} />
                    <span className="capitalizar">{dataLonga(proximo.data_inicio)}</span>
                  </li>
                  {hora(proximo.data_inicio) && (
                    <li><Icone nome="relogio" tamanho={15} />{hora(proximo.data_inicio)}</li>
                  )}
                  {proximo.local && (
                    <li><Icone nome="local" tamanho={15} />{proximo.local}</li>
                  )}
                </ul>
              </div>

              <span className="link proximo-cta">
                Ver detalhes <Icone nome="seta" tamanho={15} />
              </span>
            </Link>
          )}

          <div className="dash-grade">
            <section className="rv" style={{ '--d': 3 }}>
              <div className="secao-cab">
                <h2>{proximo ? 'Na sequência' : 'Seus eventos'}</h2>
                <Link to="/eventos" className="link">
                  Ver todos <Icone nome="seta" tamanho={14} />
                </Link>
              </div>
              {proximo && seguintes.length === 0 ? (
                <p className="dash-nada">Nenhum outro evento agendado depois deste.</p>
              ) : (
                <ul className="ev-lista">
                  {(proximo ? seguintes : eventos.slice(-5).reverse()).map((evento, i) => (
                    <EventoLinha key={evento.id} evento={evento} indice={i} />
                  ))}
                </ul>
              )}
            </section>

            <aside className="dash-resumo rv" style={{ '--d': 4 }}>
              <p className="eyebrow">Visão geral</p>
              <dl>
                <div><dt>Eventos pela frente</dt><dd className="num">{futuros.length}</dd></div>
                <div><dt>Nos próximos 30 dias</dt><dd className="num">{emBreve}</dd></div>
                <div><dt>Já realizados</dt><dd className="num">{passados}</dd></div>
              </dl>
            </aside>
          </div>
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
