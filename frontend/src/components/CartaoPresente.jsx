import Icone from './Icone'
import { iconePresente } from '../utils/categorias'
import { moeda } from '../utils/datas'
import { esgotado } from '../hooks/usePresentes'

function CartaoPresente({ presente, indice, aoReservar, aoVerDetalhes }) {
  const reservado = esgotado(presente)
  const restantes = presente.quantidade - presente.reservados

  return (
    <li className={`pres-cartao painel ${reservado ? 'reservado' : ''}`} style={{ '--i': indice }}>
      <button className="pres-midia" onClick={() => aoVerDetalhes(presente)} tabIndex={-1} aria-hidden="true">
        {presente.imagem ? (
          <img src={presente.imagem} alt="" loading="lazy" />
        ) : (
          <Icone nome={iconePresente(presente.categoria)} tamanho={30} traco={1.3} />
        )}
      </button>

      <div className="pres-corpo">
        <div className="pres-topo">
          <span className="eyebrow">{presente.categoria || 'Presente'}</span>
          <span className={`badge ${reservado ? 'badge-neutro' : 'badge-ok'}`}>
            {reservado ? 'Reservado' : 'Disponível'}
          </span>
        </div>

        <h3 className="pres-nome">{presente.nome}</h3>

        <p className="pres-valor">
          <span className="titulo num">{presente.valor != null ? moeda(presente.valor) : 'Valor livre'}</span>
          {presente.quantidade > 1 && (
            <span className="pres-qtd">
              {reservado ? `${presente.quantidade} unidades` : `${restantes} de ${presente.quantidade} restantes`}
            </span>
          )}
        </p>

        <div className="pres-acoes">
          {reservado ? (
            <span className="pres-reservado"><Icone nome="check" tamanho={15} /> Reservado</span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => aoReservar(presente)}>
              <Icone nome="presente" tamanho={15} /> Reservar presente
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => aoVerDetalhes(presente)}>Ver detalhes</button>
        </div>
      </div>
    </li>
  )
}

export default CartaoPresente
