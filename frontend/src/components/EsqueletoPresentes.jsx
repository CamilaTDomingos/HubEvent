function EsqueletoPresentes() {
  return (
    <ul className="pres-grade" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="pres-cartao painel pres-esqueleto">
          <div className="pres-midia" />
          <div className="pres-corpo">
            <span className="esq esq-curto" />
            <span className="esq esq-longo" />
            <span className="esq esq-medio" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default EsqueletoPresentes
