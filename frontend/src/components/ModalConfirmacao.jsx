function ModalConfirmacao({ aberto, titulo, mensagem, aoConfirmar, aoCancelar, textoConfirmar = 'Confirmar' }) {
  if (!aberto) return null

  return (
    <div className="overlay open">
      <div className="popup" style={{ maxWidth: 380 }}>
        <div className="popup-title">{titulo}</div>
        <p className="popup-sub">{mensagem}</p>

        <div className="popup-actions">
          <button className="btn btn-ghost" onClick={aoCancelar}>
            Cancelar
          </button>
          <button className="btn btn-primary" style={{ background: 'var(--red)' }} onClick={aoConfirmar}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmacao