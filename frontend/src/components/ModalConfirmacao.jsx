function ModalConfirmacao({ aberto, titulo, mensagem, aoConfirmar, aoCancelar, textoConfirmar = 'Confirmar' }) {
  if (!aberto) return null

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && aoCancelar()}>
      <div className="popup popup-sm" role="alertdialog" aria-modal="true" aria-labelledby="confirmacao-titulo">
        <h2 id="confirmacao-titulo" className="popup-title titulo">{titulo}</h2>
        <p className="popup-sub">{mensagem}</p>

        <div className="popup-actions">
          <button className="btn btn-ghost" onClick={aoCancelar} autoFocus>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={aoConfirmar}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmacao
