import { useState } from 'react'
import { useEventos } from '../hooks/useEventos'
import LayoutApp from '../components/LayoutApp'
import ModalCriarEvento from '../components/ModalCriarEvento'
import EventoLinha from '../components/EventoLinha'
import Carregando from '../components/Carregando'
import Forma from '../components/Forma'
import { tipoEvento } from '../utils/categorias'
import { diasAte, mesAno } from '../utils/datas'
import './Eventos.css'

function agruparPorMes(eventos) {
  return eventos.reduce((grupos, evento) => {
    const chave = mesAno(evento.data_inicio)
    const grupo = grupos.find((g) => g.chave === chave)
    if (grupo) grupo.eventos.push(evento)
    else grupos.push({ chave, eventos: [evento] })
    return grupos
  }, [])
}

function Eventos() {
  const { eventos, carregando, recarregar } = useEventos()
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState(null)
  const [modalAberto, setModalAberto] = useState(false)

  const tiposPresentes = [...new Set(eventos.map((e) => e.categoria).filter(Boolean))]

  const eventosFiltrados = eventos.filter(
    (evento) =>
      evento.nome.toLowerCase().includes(busca.toLowerCase()) &&
      (!filtroTipo || evento.categoria === filtroTipo)
  )

  const futuros = eventosFiltrados.filter((e) => diasAte(e.data_inicio) >= 0)
  const passados = eventosFiltrados.filter((e) => diasAte(e.data_inicio) < 0).reverse()
  const grupos = agruparPorMes(futuros)

  let indice = 0

  return (
    <LayoutApp>
      <header className="agenda-topo">
        <div className="rv">
          <p className="eyebrow">Agenda</p>
          <h1 className="display agenda-titulo">
            Seus eventos
            {!carregando && <sup className="agenda-conta">{eventos.length}</sup>}
          </h1>
        </div>

        <div className="agenda-acoes rv" style={{ '--d': 1 }}>
          <label className="busca">
            <span className="sr-only">Buscar evento</span>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input placeholder="procurar evento…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={() => setModalAberto(true)}>
            + Novo evento
          </button>
        </div>
      </header>

      {tiposPresentes.length > 1 && (
        <div className="filtros rv" style={{ '--d': 2 }} role="group" aria-label="Filtrar por tipo">
          <button className={`filtro ${!filtroTipo ? 'sel' : ''}`} onClick={() => setFiltroTipo(null)}>
            Todos
          </button>
          {tiposPresentes.map((t) => {
            const tipo = tipoEvento(t)
            return (
              <button
                key={t}
                className={`filtro ${filtroTipo === t ? 'sel' : ''}`}
                onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}
              >
                <Forma tipo={tipo.forma} cor={tipo.cor} tamanho={14} contorno />
                {t}
              </button>
            )
          })}
        </div>
      )}

      {carregando ? (
        <Carregando texto="Abrindo a agenda…" />
      ) : eventosFiltrados.length === 0 ? (
        <div className="agenda-vazia rv">
          <Forma tipo="blob" cor="var(--paper-3)" tamanho={90} contorno />
          <p className="display">
            {eventos.length === 0 ? (
              <>Nenhum evento <em>por aqui.</em></>
            ) : (
              <>Nada encontrado{busca && <> para <em>“{busca}”</em></>}.</>
            )}
          </p>
          {eventos.length === 0 && (
            <button className="btn btn-outline" onClick={() => setModalAberto(true)}>Criar evento</button>
          )}
        </div>
      ) : (
        <>
          {grupos.map((grupo) => (
            <section key={grupo.chave} className="mes">
              <h2 className="mes-titulo">{grupo.chave}</h2>
              <ul className="ev-lista">
                {grupo.eventos.map((evento) => (
                  <EventoLinha key={evento.id} evento={evento} indice={indice++} />
                ))}
              </ul>
            </section>
          ))}

          {passados.length > 0 && (
            <section className="mes mes-passado">
              <h2 className="mes-titulo">Já aconteceram</h2>
              <ul className="ev-lista">
                {passados.map((evento) => (
                  <EventoLinha key={evento.id} evento={evento} indice={indice++} />
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

export default Eventos
