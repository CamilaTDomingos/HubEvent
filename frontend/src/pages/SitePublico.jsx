import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PreviewSite from '../components/PreviewSite'
import CartaoPresente from '../components/CartaoPresente'
import EsqueletoPresentes from '../components/EsqueletoPresentes'
import ModalPresentear from '../components/ModalPresentear'
import Carregando from '../components/Carregando'
import Icone from '../components/Icone'
import { usePresentes, esgotado } from '../hooks/usePresentes'
import { lerModulos } from '../utils/modulos'
import './SiteEvento.css'
import './SitePublico.css'

const RECURSOS_PADRAO = { confirmarPresenca: true, listaPresentes: true }

function ListaPresentesSite({ eventoId }) {
  const { presentes, carregando, reservar, recebimento } = usePresentes(eventoId)
  const [escolhidoId, setEscolhidoId] = useState(null)
  const escolhido = presentes.find((p) => p.id === escolhidoId) || null

  // Disponíveis primeiro: é o que o convidado veio procurar.
  const ordenados = [...presentes].sort((a, b) => esgotado(a) - esgotado(b))
  const todosReservados = presentes.length > 0 && presentes.every(esgotado)

  return (
    <section className="ps-presentes" id="presentes">
      <p className="ps-rotulo">Lista de presentes</p>
      <h2 className="ps-presentes-titulo">Escolha um presente para celebrar esse momento especial.</h2>

      {carregando ? (
        <EsqueletoPresentes />
      ) : presentes.length === 0 ? (
        <p className="ps-presentes-vazio">A lista de presentes ainda está sendo preparada. Volte em breve!</p>
      ) : (
        <>
          {todosReservados && (
            <p className="ps-presentes-vazio">Todos os presentes já foram escolhidos. Obrigado pelo carinho!</p>
          )}
          <ul className="pres-grade">
            {ordenados.map((p, i) => (
              <CartaoPresente key={p.id} presente={p} indice={i} aoAbrir={(item) => !esgotado(item) && setEscolhidoId(item.id)}>
                {esgotado(p) ? (
                  <span className="pres-status muted"><Icone nome="check" tamanho={14} /> Já escolhido</span>
                ) : (
                  <button className="btn btn-primary btn-sm ps-presentear" onClick={() => setEscolhidoId(p.id)}>
                    <Icone nome="presente" tamanho={15} /> Presentear
                  </button>
                )}
              </CartaoPresente>
            ))}
          </ul>
        </>
      )}

      {escolhido && (
        <ModalPresentear
          key={escolhido.id}
          presente={escolhido}
          recebimento={recebimento}
          aoReservar={reservar}
          aoFechar={() => setEscolhidoId(null)}
        />
      )}
    </section>
  )
}

function SitePublico() {
  const { slug } = useParams()
  const [site, setSite] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    async function buscar() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/site/${slug}`)
        if (!res.ok) throw new Error()
        setSite(await res.json())
      } catch {
        setErro('Este site não existe ou ainda não foi publicado.')
      }
    }
    buscar()
  }, [slug])

  if (erro) {
    return (
      <div className="site-publico site-publico-erro">
        <div className="painel">
          <Icone nome="globo" tamanho={24} />
          <h1 className="titulo">Site não encontrado</h1>
          <p>{erro} Confira o endereço com quem te convidou.</p>
        </div>
      </div>
    )
  }

  if (!site) return <Carregando texto="Abrindo o site…" telaCheia />

  const { evento, titulo, conteudo } = site
  const recursos = { ...RECURSOS_PADRAO, ...conteudo?.recursos }
  const modulos = lerModulos(evento.id)
  const mostrarPresentes = modulos.presentes && recursos.listaPresentes

  return (
    <div className="site-publico">
      <PreviewSite
        publico
        evento={evento}
        titulo={titulo}
        mensagem={conteudo?.mensagem}
        cor={conteudo?.cor || '#16a37a'}
        recursos={{ ...recursos, listaPresentes: mostrarPresentes }}
      >
        {mostrarPresentes && <ListaPresentesSite eventoId={evento.id} />}
      </PreviewSite>
    </div>
  )
}

export default SitePublico
