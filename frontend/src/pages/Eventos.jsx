import { useState } from 'react'
import { useEventos } from '../hooks/useEventos'
import LayoutApp from '../components/LayoutApp'
import ModalCriarEvento from '../components/ModalCriarEvento'
import EventoLinha from '../components/EventoLinha'
import Carregando from '../components/Carregando'
import Icone from '../components/Icone'
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
      <header className="cab">
        <div className="rv">
          <p className="eyebrow">Agenda</p>
          <h1 className="titulo">
            Meus eventos {!carregando && <span className="cab-conta">{eventos.length}</span>}
          </h1>
        </div>

        <div className="cab-acoes rv" style={{ '--d': 1 }}>
          <label className="busca">
            <span className="sr-only">Buscar evento</span>
            <Icone nome="busca" tamanho={16} />
            <input placeholder="Buscar evento…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={() => setModalAberto(true)}>
            <Icone nome="mais" tamanho={16} /> Novo evento
          </button>
        </div>
      </header>

      {tiposPresentes.length > 1 && (
        <div className="filtros rv" style={{ '--d': 2 }} role="group" aria-label="Filtrar por tipo">
          <button className={`tipo-chip ${!filtroTipo ? 'sel' : ''}`} aria-pressed={!filtroTipo} onClick={() => setFiltroTipo(null)}>
            Todos
          </button>
          {tiposPresentes.map((t) => (
            <button
              key={t}
              className={`tipo-chip ${filtroTipo === t ? 'sel' : ''}`}
              aria-pressed={filtroTipo === t}
              onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}
            >
              <Icone nome={tipoEvento(t).icone} tamanho={15} />
              {t}
            </button>
          ))}
        </div>
      )}

      {carregando ? (
        <Carregando texto="Abrindo a agenda…" />
      ) : eventosFiltrados.length === 0 ? (
        <div className="agenda-vazia rv">
          <span className="vazio-icone"><Icone nome={eventos.length === 0 ? 'calendario' : 'busca'} tamanho={24} /></span>
          <p className="titulo">
            {eventos.length === 0 ? 'Nenhum evento por aqui ainda' : <>Nada encontrado{busca && <> para “{busca}”</>}</>}
          </p>
          {eventos.length === 0 && (
            <button className="btn btn-secondary" onClick={() => setModalAberto(true)}>Criar evento</button>
          )}
        </div>
      ) : (
        <>
          {grupos.map((grupo) => (
            <section key={grupo.chave} className="mes">
              <h2 className="mes-titulo">{grupo.chave}<span>{grupo.eventos.length}</span></h2>
              <ul className="ev-lista">
                {grupo.eventos.map((evento) => (
                  <EventoLinha key={evento.id} evento={evento} indice={indice++} />
                ))}
              </ul>
            </section>
          ))}

          {passados.length > 0 && (
            <section className="mes mes-passado">
              <h2 className="mes-titulo">Já aconteceram<span>{passados.length}</span></h2>
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
