import Icone from './Icone'

// Lado institucional das telas de acesso: mensagem + uma prévia do produto.
function PainelAuth({ titulo, texto }) {
  return (
    <aside className="auth-painel">
      <div className="auth-deco d1" aria-hidden="true" />
      <div className="auth-deco d2" aria-hidden="true" />

      <div className="marca auth-marca">
        <span className="marca-simbolo"><Icone nome="brilho" tamanho={15} traco={1.8} /></span>
        HubEvent
      </div>

      <div className="auth-manchete">
        <h1 className="titulo">{titulo}</h1>
        <p>{texto}</p>
      </div>

      <div className="auth-amostra painel" aria-hidden="true">
        <div className="amostra-topo">
          <span className="selo-tipo amostra-selo"><Icone nome="aneis" /></span>
          <div>
            <strong>Casamento Ana & Bruno</strong>
            <span>Sábado, 14 de novembro</span>
          </div>
          <span className="quando perto">em 42 dias</span>
        </div>
        <div className="amostra-linha">
          <span>32 de 48 confirmaram</span>
          <span className="amostra-barra"><i style={{ width: '66%' }} /></span>
        </div>
        <div className="amostra-linha">
          <span>Orçamento</span>
          <span className="amostra-barra"><i style={{ width: '58%', background: 'var(--blue)' }} /></span>
        </div>
      </div>
    </aside>
  )
}

export default PainelAuth
