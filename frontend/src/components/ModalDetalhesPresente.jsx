import Icone from './Icone'
import { esgotado, FORMAS_PRESENTE } from '../hooks/usePresentes'
import { iconePresente } from '../utils/categorias'
import { moeda } from '../utils/datas'

function ModalDetalhesPresente({ presente, aoFechar, aoEditar, aoRemover }) {
  if (!presente) return null

  const reservado = esgotado(presente)

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="popup pres-detalhe" role="dialog" aria-modal="true" aria-labelledby="pres-detalhe-titulo">
        <div className="pres-detalhe-midia">
          {presente.imagem ? (
            <img src={presente.imagem} alt={presente.nome} />
          ) : (
            <button type="button" className="pres-detalhe-addfoto" onClick={() => aoEditar(presente)}>
              <Icone nome={iconePresente(presente.categoria)} tamanho={40} traco={1.2} />
              <span><Icone nome="imagem" tamanho={14} /> Adicionar foto</span>
            </button>
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
        {presente.link && (
          <a className="link pres-detalhe-link" href={presente.link} target="_blank" rel="noopener noreferrer">
            Ver na loja <Icone nome="abrir" tamanho={13} />
          </a>
        )}

        <div className="pres-reservas">
          <p className="label">
            Reservas <span className="num">· {presente.reservas.length} de {presente.quantidade}</span>
          </p>
          {presente.reservas.length === 0 ? (
            <p className="pres-reservas-vazio">Nenhum convidado escolheu este presente ainda.</p>
          ) : (
            <ul>
              {presente.reservas.map((r, i) => (
                <li key={i}>
                  <span className="avatar">{r.nome.trim()[0]?.toUpperCase()}</span>
                  <strong>{r.nome}</strong>
                  <span className="muted">{FORMAS_PRESENTE[r.forma]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="popup-actions pres-detalhe-acoes">
          <button className="btn btn-ghost pres-remover" onClick={() => aoRemover(presente)}>
            <Icone nome="lixeira" tamanho={15} /> Remover
          </button>
          <button className="btn btn-ghost" onClick={aoFechar}>Fechar</button>
          <button className="btn btn-secondary" onClick={() => aoEditar(presente)}>
            <Icone nome="editar" tamanho={15} /> Editar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalDetalhesPresente
