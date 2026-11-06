import { moeda } from '../utils/datas'

// Barras horizontais: quanto cada pessoa já pagou (parcelas marcadas como pagas).
// `porPagador`: [[nome, total], ...] de resumoPagamentos, do maior para o menor.
function GraficoPagamentosPorPessoa({ porPagador }) {
  const total = porPagador.reduce((soma, [, valor]) => soma + valor, 0)
  const maior = porPagador[0]?.[1] || 1

  return (
    <section className="painel">
      <div className="painel-cab">
        <h3 className="titulo">Quanto cada um pagou</h3>
      </div>
      {porPagador.length === 0 ? (
        <p className="muted painel-vazio">Quando você registrar pagamentos, o total pago por pessoa aparece aqui.</p>
      ) : (
        <div className="pagou-corpo">
          <ul className="pagou-lista">
            {porPagador.map(([nome, valor]) => (
              <li key={nome}>
                <div className="pagou-topo">
                  <span className="pagou-nome">{nome}</span>
                  <strong className="num pagou-valor">
                    {moeda(valor)}
                    <span>{Math.round((valor / total) * 100)}%</span>
                  </strong>
                </div>
                <div
                  className="pagou-trilho"
                  role="img"
                  aria-label={`${nome} pagou ${moeda(valor)}, ${Math.round((valor / total) * 100)}% do total pago`}
                >
                  <div className="pagou-barra" style={{ width: `${(valor / maior) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export default GraficoPagamentosPorPessoa
