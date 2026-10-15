import { Link } from 'react-router-dom'
import Icone from './Icone'
import { tipoEvento } from '../utils/categorias'
import { dia, mesCurto, diasAte, rotuloContagem, hora } from '../utils/datas'

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
          <span className="ev-linha-mes">{mesCurto(evento.data_inicio)}</span>
        </div>
        <span className="selo-tipo"><Icone nome={tipo.icone} /></span>
        <div className="ev-linha-corpo">
          <div className="ev-linha-nome">{evento.nome}</div>
          {meta && <div className="ev-linha-meta">{meta}</div>}
        </div>
        <span className={`quando ${dias >= 0 && dias <= 30 ? 'perto' : ''}`}>
          {rotuloContagem(evento.data_inicio)}
        </span>
        <Icone nome="chevron" tamanho={16} className="ev-linha-seta" />
      </Link>
    </li>
  )
}

export default EventoLinha
