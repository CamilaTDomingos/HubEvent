import { Link } from 'react-router-dom'
import Forma from './Forma'
import { tipoEvento } from '../utils/categorias'
import { dia, mesCurto, semanaCurta, diasAte, rotuloContagem, hora } from '../utils/datas'

function EventoLinha({ evento, indice = 0 }) {
  const tipo = tipoEvento(evento.categoria)
  const dias = diasAte(evento.data_inicio)
  const horario = hora(evento.data_inicio)
  const meta = [evento.categoria, horario, evento.local].filter(Boolean).join(' · ')

  return (
    <li>
      <Link
        to={`/eventos/${evento.id}`}
        className={`ev-linha ${dias < 0 ? 'passado' : ''}`}
        style={{ '--i': indice }}
      >
        <div className="ev-linha-data">
          <span className="ev-linha-dia">{dia(evento.data_inicio)}</span>
          <span className="ev-linha-mes">
            {mesCurto(evento.data_inicio)} · {semanaCurta(evento.data_inicio)}
          </span>
        </div>
        <Forma tipo={tipo.forma} cor={tipo.cor} tamanho={40} contorno />
        <div className="ev-linha-corpo">
          <div className="ev-linha-nome">{evento.nome}</div>
          {meta && <div className="ev-linha-meta">{meta}</div>}
        </div>
        <span className={`ev-linha-quando ${dias >= 0 && dias <= 30 ? 'perto' : ''}`}>
          {rotuloContagem(evento.data_inicio)}
        </span>
        <span className="ev-linha-seta" aria-hidden="true">→</span>
      </Link>
    </li>
  )
}

export default EventoLinha
