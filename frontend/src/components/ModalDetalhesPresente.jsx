import Icone from './Icone'
import { esgotado } from '../hooks/usePresentes'
import { iconePresente } from '../utils/categorias'
import { moeda } from '../utils/datas'

function ModalDetalhesPresente({ presente, aoFechar, aoReservar, aoRemover }) {
  if (!presente) return null

  const reservado = esgotado(presente)

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="popup pres-detalhe" role="dialog" aria-modal="true" aria-labelledby="pres-detalhe-titulo">
        <div className="pres-detalhe-midia">
          {presente.imagem ? (
            <img src={presente.imagem} alt={presente.nome} />
          ) : (
            <Icone nome={iconePresente(presente.categoria)} tamanho={40} traco={1.2} />
          )}
        </div>

        <div className="pres-topo">
          <span className="eyebrow">{presente.categoria || 'Presente'}</span>
          <span className={`badge ${reservado ? 'badge-neutro' : 'badge-ok'}`}>
            {reservado ? 'Reservado' : 'Disponível'}
          </span>
        </div>
        <h2 id="pres-detalhe-titulo" className="popup-title titulo">{presente.nome}</h2>
        <p className="pres-detalhe-valor titulo num">
          {presente.valor != null ? moeda(presente.valor) : 'Valor livre'}
        </p>

        {presente.descricao && <p className="pres-detalhe-desc">{presente.descricao}</p>}

        <dl className="pres-detalhe-dados">
          <div>
            <dt>Quantidade</dt>
            <dd className="num">{presente.quantidade}</dd>
          </div>
          <div>
            <dt>Reservados</dt>
            <dd className="num">{presente.reservados} de {presente.quantidade}</dd>
          </div>
          {presente.reservadoPor && (
            <div>
              <dt>{presente.quantidade > 1 ? 'Última reserva' : 'Reservado por'}</dt>
              <dd>{presente.reservadoPor}</dd>
            </div>
          )}
        </dl>

        <div className="popup-actions pres-detalhe-acoes">
          <button className="btn btn-ghost pres-remover" onClick={() => aoRemover(presente)}>
            <Icone nome="lixeira" tamanho={15} /> Remover
          </button>
          <button className="btn btn-ghost" onClick={aoFechar}>Fechar</button>
          {!reservado && (
            <button className="btn btn-primary" onClick={() => aoReservar(presente)}>
              <Icone nome="presente" tamanho={15} /> Reservar presente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalDetalhesPresente
