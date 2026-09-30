import Forma from './Forma'
import { tipoEvento } from '../utils/categorias'
import { dataLonga, hora, diasAte } from '../utils/datas'

// Renderiza a página pública do evento a partir das escolhas do construtor.
function PreviewSite({ evento, titulo, mensagem, cor, recursos }) {
  const tipo = tipoEvento(evento.categoria)
  const dias = diasAte(evento.data_inicio)
  const horario = hora(evento.data_inicio)

  return (
    <div className="ps" style={{ '--tema': cor }}>
      <section className="ps-hero">
        <Forma tipo={tipo.forma} cor="rgba(255,255,255,0.14)" tamanho={260} className="ps-forma-a" />
        <Forma tipo="circulo" cor="rgba(255,255,255,0.1)" tamanho={90} className="ps-forma-b" />
        <p className="ps-tipo">{evento.categoria || 'Evento'}</p>
        <h1 className="ps-titulo">{titulo || evento.nome}</h1>
        <p className="ps-data">
          {dataLonga(evento.data_inicio)}
          {horario && ` · ${horario}`}
        </p>
        {evento.local && <p className="ps-local">{evento.local}</p>}
      </section>

      {recursos.contadorRegressivo && dias >= 0 && (
        <section className="ps-contador">
          <strong>{dias}</strong>
          <span>{dias === 1 ? 'dia para o grande dia' : 'dias para o grande dia'}</span>
        </section>
      )}

      {mensagem && (
        <section className="ps-bloco">
          <p className="ps-mensagem">“{mensagem}”</p>
        </section>
      )}

      {(recursos.confirmarPresenca || recursos.listaPresentes) && (
        <section className="ps-bloco ps-acoes">
          {recursos.confirmarPresenca && <span className="ps-btn">Confirmar presença</span>}
          {recursos.listaPresentes && <span className="ps-btn ps-btn-contorno">Ver lista de presentes</span>}
        </section>
      )}

      {recursos.galeriaFotos && (
        <section className="ps-bloco">
          <p className="ps-rotulo">Galeria</p>
          <div className="ps-galeria">
            {[0.9, 0.55, 0.3].map((o) => (
              <span key={o} style={{ '--o': o }} />
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
            <Forma tipo="circulo" cor="var(--tema)" tamanho={18} contorno className="ps-pino" />
          </div>
          {evento.local && <p className="ps-local-mapa">{evento.local}</p>}
        </section>
      )}

      <footer className="ps-rodape">feito com HubEvent</footer>
    </div>
  )
}

export default PreviewSite
