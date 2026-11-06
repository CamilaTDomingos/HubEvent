import Icone from './Icone'
import { tipoEvento } from '../utils/categorias'
import { dataLonga, hora, diasAte } from '../utils/datas'

// Renderiza a página do evento a partir das escolhas do construtor: como
// prévia no construtor e, com `publico`, como o site que o convidado abre.
function PreviewSite({ evento, titulo, mensagem, cor, recursos, publico = false, children }) {
  const tipo = tipoEvento(evento.categoria)
  const dias = diasAte(evento.data_inicio)
  const horario = hora(evento.data_inicio)

  return (
    <div className="ps" style={{ '--tema': cor }}>
      <section className="ps-hero">
        <div className="ps-moldura">
          <span className="ps-icone"><Icone nome={tipo.icone} tamanho={20} /></span>
          <p className="ps-tipo">{evento.categoria || 'Evento'}</p>
          <h1 className="ps-titulo">{titulo || evento.nome}</h1>
          <p className="ps-data">
            {dataLonga(evento.data_inicio)}
            {horario && ` · ${horario}`}
          </p>
          {evento.local && <p className="ps-local">{evento.local}</p>}
        </div>
      </section>

      {recursos.contadorRegressivo && dias >= 0 && (
        <section className="ps-contador">
          <strong>{dias}</strong>
          <span>{dias === 1 ? 'dia para o grande dia' : 'dias para o grande dia'}</span>
        </section>
      )}

      {mensagem && (
        <section className="ps-bloco">
          <p className="ps-mensagem">{mensagem}</p>
        </section>
      )}

      {(recursos.confirmarPresenca || recursos.listaPresentes) && (
        <section className="ps-bloco ps-acoes">
          {recursos.confirmarPresenca &&
            (publico ? (
              <p className="ps-nota">Confirme sua presença pelo link que você recebeu no convite.</p>
            ) : (
              <span className="ps-btn">Confirmar presença</span>
            ))}
          {recursos.listaPresentes &&
            (publico ? (
              <a className="ps-btn ps-btn-contorno" href="#presentes"><Icone nome="presente" tamanho={15} /> Lista de presentes</a>
            ) : (
              <span className="ps-btn ps-btn-contorno"><Icone nome="presente" tamanho={15} /> Lista de presentes</span>
            ))}
        </section>
      )}

      {recursos.galeriaFotos && (
        <section className="ps-bloco">
          <p className="ps-rotulo">Galeria</p>
          <div className="ps-galeria">
            {[0.22, 0.14, 0.08].map((o) => (
              <span key={o} style={{ '--o': o }}><Icone nome="imagem" tamanho={18} /></span>
            ))}
          </div>
        </section>
      )}

      {recursos.mapaLocal && (
        <section className="ps-bloco">
          <p className="ps-rotulo">Como chegar</p>
          <div className="ps-mapa">
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 80 Q80 60 140 78 T300 60" />
              <path d="M60 0 L90 120" />
              <path d="M200 0 Q190 60 230 120" />
              <path d="M0 30 L300 40" />
            </svg>
            <span className="ps-pino"><Icone nome="local" tamanho={22} traco={1.8} /></span>
          </div>
          {evento.local && <p className="ps-local-mapa">{evento.local}</p>}
        </section>
      )}

      {children}

      <footer className="ps-rodape">Feito com HubEvent</footer>
    </div>
  )
}

export default PreviewSite
