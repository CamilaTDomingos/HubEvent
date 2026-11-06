import Icone from './Icone'
import { PALETA_CATEGORIAS, corEmUso } from '../utils/coresCategoria'

// Paleta sugerida + seletor livre. Cores já usadas por outra categoria
// aparecem esmaecidas.
function SeletorCor({ valor, aoMudar, categorias, ignorarId }) {
  const personalizada = !PALETA_CATEGORIAS.includes(valor?.toLowerCase())

  return (
    <div className="seletor-cor" role="radiogroup" aria-label="Cor da categoria">
      {PALETA_CATEGORIAS.map((cor) => {
        const dono = corEmUso(categorias, cor, ignorarId)
        return (
          <button
            key={cor}
            type="button"
            role="radio"
            aria-checked={valor?.toLowerCase() === cor}
            className={`cor-amostra ${dono ? 'usada' : ''}`}
            style={{ '--cat': cor }}
            onClick={() => aoMudar(cor)}
            title={dono ? `Já usada em "${dono.nome}"` : cor}
          >
            <Icone nome="check" tamanho={13} traco={2.4} />
          </button>
        )
      })}
      <label className={`cor-amostra cor-livre ${personalizada ? 'sel' : ''}`} style={personalizada ? { '--cat': valor } : undefined} title="Outra cor">
        <input type="color" value={valor} onChange={(e) => aoMudar(e.target.value)} aria-label="Escolher outra cor" />
        <Icone nome="mais" tamanho={13} traco={2.2} />
      </label>
    </div>
  )
}

export default SeletorCor
