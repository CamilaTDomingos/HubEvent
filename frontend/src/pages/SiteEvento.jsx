import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLandingPage } from '../hooks/useLandingPage'
import LayoutApp from '../components/LayoutApp'
import PreviewSite from '../components/PreviewSite'
import Carregando from '../components/Carregando'
import Icone from '../components/Icone'
import './SiteEvento.css'

const CORES = [
  { hex: '#16a37a', nome: 'Esmeralda' },
  { hex: '#6d47c9', nome: 'Violeta' },
  { hex: '#d94f6e', nome: 'Rosé' },
  { hex: '#e86a2a', nome: 'Terracota' },
  { hex: '#3b6fe8', nome: 'Azul' },
  { hex: '#111318', nome: 'Grafite' },
]

const RECURSOS_LABELS = {
  confirmarPresenca: 'Confirmar presença online',
  listaPresentes: 'Exibir lista de presentes',
  contadorRegressivo: 'Contador regressivo',
  galeriaFotos: 'Galeria de fotos',
  mapaLocal: 'Mapa do local',
}

function SiteEvento() {
  const { id } = useParams()
  const [evento, setEvento] = useState(null)
  const { landingPage, carregando, salvar, conteudoPadrao } = useLandingPage(id, evento?.nome)

  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [cor, setCor] = useState(conteudoPadrao.cor)
  const [recursos, setRecursos] = useState(conteudoPadrao.recursos)
  const [ativa, setAtiva] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  // The form state must be synchronized when the async event/page data loads.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    async function buscarEvento() {
      const { data } = await supabase.from('evento').select('*').eq('id', id).single()
      setEvento(data)
    }
    buscarEvento()
  }, [id])

  useEffect(() => {
    if (!carregando) {
      if (landingPage) {
        setTitulo(landingPage.titulo)
        setMensagem(landingPage.conteudoParsed.mensagem)
        setCor(landingPage.conteudoParsed.cor)
        setRecursos(landingPage.conteudoParsed.recursos)
        setAtiva(landingPage.ativa)
      } else if (evento) {
        setTitulo(evento.nome)
        setMensagem(conteudoPadrao.mensagem)
      }
    }
  }, [carregando, landingPage, evento, conteudoPadrao])
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggleRecurso(chave) {
    setRecursos((atual) => ({ ...atual, [chave]: !atual[chave] }))
  }

  async function handlePublicar() {
    setSalvando(true)
    setSucesso(false)

    const error = await salvar({
      titulo,
      ativa: true,
      conteudoParsed: { mensagem, cor, recursos },
    })

    setSalvando(false)
    if (!error) {
      setAtiva(true)
      setSucesso(true)
    }
  }

  if (carregando || !evento) {
    return (
      <LayoutApp>
        <Carregando texto="Preparando o construtor…" />
      </LayoutApp>
    )
  }

  const slugPreview = (titulo || evento.nome)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return (
    <LayoutApp>
      <Link to={`/eventos/${id}`} className="voltar"><Icone nome="voltar" tamanho={15} /> {evento.nome}</Link>

      <header className="cab site-topo rv">
        <div>
          <p className="eyebrow">Site do evento</p>
          <h1 className="titulo">Monte a página <em>do convite</em></h1>
        </div>
        <span className={`site-status ${ativa ? 'no-ar' : ''}`}>
          <span className="ponto" /> {ativa ? 'Publicado' : 'Rascunho'}
        </span>
      </header>

      <div className="site">
        <div className="site-controles painel">
          <section className="passo rv" style={{ '--d': 1 }}>
            <h2 className="passo-titulo"><span>1</span> Texto</h2>
            <div className="field">
              <label htmlFor="site-titulo">Título</label>
              <input id="site-titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="site-mensagem">Mensagem para os convidados</label>
              <textarea id="site-mensagem" rows={3} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
            </div>
          </section>

          <section className="passo rv" style={{ '--d': 2 }}>
            <h2 className="passo-titulo"><span>2</span> Cor</h2>
            <div className="cores" role="radiogroup" aria-label="Cor do tema">
              {CORES.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  role="radio"
                  aria-checked={cor === c.hex}
                  aria-label={c.nome}
                  title={c.nome}
                  className={`cor ${cor === c.hex ? 'sel' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setCor(c.hex)}
                >
                  {cor === c.hex && <Icone nome="check" tamanho={15} traco={2.4} />}
                </button>
              ))}
            </div>
          </section>

          <section className="passo rv" style={{ '--d': 3 }}>
            <h2 className="passo-titulo"><span>3</span> O que mostrar</h2>
            <div className="recursos">
              {Object.entries(RECURSOS_LABELS).map(([chave, label]) => (
                <label key={chave} className="switch recurso">
                  <input type="checkbox" checked={recursos[chave]} onChange={() => toggleRecurso(chave)} />
                  <span className="switch-track" />
                  <span className="switch-texto">{label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="publicar rv" style={{ '--d': 4 }}>
            <button className="btn btn-primary btn-lg btn-block" onClick={handlePublicar} disabled={salvando}>
              {salvando ? 'Publicando…' : ativa ? 'Atualizar site' : 'Publicar site'}
            </button>
            {sucesso ? (
              <p className="publicado" role="status"><Icone nome="check" tamanho={15} /> Site publicado com sucesso</p>
            ) : (
              <p className="publicar-url">hubevent.app/{slugPreview}</p>
            )}
          </div>
        </div>

        <div className="site-previa rv" style={{ '--d': 2 }}>
          <div className="moldura">
            <div className="moldura-barra">
              <span className="moldura-bolas" aria-hidden="true"><i /><i /><i /></span>
              <span className="moldura-url">hubevent.app/{slugPreview}</span>
            </div>
            <div className="moldura-tela">
              <PreviewSite evento={evento} titulo={titulo} mensagem={mensagem} cor={cor} recursos={recursos} />
            </div>
          </div>
          <p className="previa-legenda">Prévia ao vivo · as alterações aparecem na hora</p>
        </div>
      </div>
    </LayoutApp>
  )
}

export default SiteEvento
