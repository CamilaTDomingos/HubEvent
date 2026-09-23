import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLandingPage } from '../hooks/useLandingPage'
import Sidebar from '../components/Sidebar'

const CORES = ['#16a37a', '#6d47c9', '#d94f6e', '#e86a2a', '#3b6fe8', '#111318']

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
  const [cor, setCor] = useState('#16a37a')
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

  if (carregando || !evento) return <p style={{ padding: 40 }}>Carregando...</p>

  const slugPreview = (titulo || evento.nome)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return (
    <div className="screen">
      <Sidebar />
      <div className="main">
        <div className="ev-header">
          <h2>{evento.nome}</h2>
          <div className="meta">Site do evento</div>
        </div>

        <div className="page-body">
          <div className="site-wrap">
            <div className="site-panel">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Construtor de site</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Personalize a página do evento</div>

              <div className="ctrl-sep">Informações</div>
              <div className="field">
                <label>Título</label>
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="field">
                <label>Mensagem</label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div className="ctrl-sep">Cor do tema</div>
              <div className="color-sw">
                {CORES.map((c) => (
                  <div
                    key={c}
                    className={`cs ${cor === c ? 'sel' : ''}`}
                    style={{ background: c }}
                    onClick={() => setCor(c)}
                  />
                ))}
              </div>

              <div className="ctrl-sep">Recursos</div>
              {Object.entries(RECURSOS_LABELS).map(([chave, label]) => (
                <label key={chave} className="toggle-row">
                  <input type="checkbox" checked={recursos[chave]} onChange={() => toggleRecurso(chave)} />
                  {label}
                </label>
              ))}

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} onClick={handlePublicar} disabled={salvando}>
                {salvando ? 'Publicando...' : ativa ? 'Atualizar site' : 'Publicar site'}
              </button>

              {sucesso && <p style={{ color: 'var(--em)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>Publicado com sucesso!</p>}

              <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 9 }}>
                hubevent.app/{slugPreview}
              </div>
            </div>

            <div className="preview-wrap">
              <div className="prev-chrome">
                <div className="prev-dots">
                  <div className="prev-dot" style={{ background: '#ff5f57' }} />
                  <div className="prev-dot" style={{ background: '#febc2e' }} />
                  <div className="prev-dot" style={{ background: '#28c840' }} />
                </div>
                <div className="prev-url-bar">hubevent.app/{slugPreview}</div>
              </div>

              <div className="prev-frame">
                <div className="prev-hero" style={{ background: cor }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    {evento.categoria || 'Evento'}
                  </div>
                  <div className="prev-hero-title">{titulo || evento.nome}</div>
                  <div className="prev-hero-sub">
                    {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
                    {evento.local ? ` · ${evento.local}` : ''}
                  </div>
                </div>

                <div className="prev-section">
                  <div className="prev-sec-lbl">Mensagem</div>
                  <div className="prev-desc-txt">{mensagem}</div>
                </div>

                {recursos.confirmarPresenca && (
                  <div className="prev-section">
                    <div className="prev-sec-lbl">Confirmar presença</div>
                    <div className="prev-desc-txt">Confirme sua presença até a data do evento.</div>
                    <span className="prev-btn" style={{ background: cor }}>Confirmar presença</span>
                  </div>
                )}

                {recursos.listaPresentes && (
                  <div className="prev-section">
                    <div className="prev-sec-lbl">Lista de presentes</div>
                    <div className="prev-desc-txt">Escolha um presente especial.</div>
                    <span className="prev-btn" style={{ background: cor }}>Ver lista de presentes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiteEvento