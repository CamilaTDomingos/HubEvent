import { useState } from 'react'
import Icone from './Icone'
import { iconePresente } from '../utils/categorias'
import { moeda } from '../utils/datas'
import { pixCopiaECola } from '../utils/pix'

const TEMPO_CHECKOUT_MS = 1400

// Fluxo do convidado no site: escolhe como presentear, informa o nome,
// conclui (loja, Pix ou cartão) e o presente fica reservado.
function ModalPresentear({ presente, recebimento, aoReservar, aoFechar }) {
  const temLoja = !!presente.link
  const temPix = !!recebimento?.chave && presente.valor > 0
  const temCartao = presente.valor > 0

  const formas = [
    temLoja && { chave: 'loja', icone: 'abrir', titulo: 'Comprar na loja', texto: 'Você compra pelo site da loja e envia aos anfitriões.' },
    temPix && { chave: 'pix', icone: 'pix', titulo: 'Pix', texto: `Envie ${moeda(presente.valor)} direto para os anfitriões.` },
    temCartao && { chave: 'cartao', icone: 'cartao', titulo: 'Cartão de crédito', texto: `Pague ${moeda(presente.valor)} em ambiente seguro.` },
  ].filter(Boolean)

  const [etapa, setEtapa] = useState('escolha')
  const [forma, setForma] = useState(formas[0]?.chave || null)
  const [nome, setNome] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState(null)

  const codigoPix = temPix
    ? pixCopiaECola({ chave: recebimento.chave, nome: recebimento.nome, cidade: recebimento.cidade || '', valor: presente.valor })
    : ''

  function concluir() {
    const ok = aoReservar(presente.id, { nome: nome.trim(), forma })
    if (ok === false) {
      setErro('Alguém acabou de reservar este presente. Que tal escolher outro?')
      return
    }
    setEtapa('feito')
  }

  function continuar(e) {
    e.preventDefault()
    if (!nome.trim() || !forma) return
    // Na loja, a reserva vem antes da compra para ninguém escolher o mesmo item.
    if (forma === 'loja') concluir()
    else setEtapa('pagamento')
  }

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(codigoPix)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copie o código Pix:', codigoPix)
    }
  }

  // Ponto de integração com o gateway (Mercado Pago, Stripe, Pagar.me…):
  // aqui o convidado seria redirecionado ao checkout e a reserva só seria
  // confirmada pelo retorno do pagamento. Por enquanto, simulado.
  async function pagarComCartao() {
    setProcessando(true)
    await new Promise((r) => setTimeout(r, TEMPO_CHECKOUT_MS))
    setProcessando(false)
    concluir()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !processando && aoFechar()}>
      <div className="popup presentear" role="dialog" aria-modal="true" aria-labelledby="presentear-titulo">
        <div className="presentear-item">
          <span className="presentear-foto">
            {presente.imagem ? <img src={presente.imagem} alt="" /> : <Icone nome={iconePresente(presente.categoria)} tamanho={24} traco={1.3} />}
          </span>
          <div>
            <h2 id="presentear-titulo" className="titulo">{presente.nome}</h2>
            <p className="titulo num presentear-valor">{presente.valor != null ? moeda(presente.valor) : 'Valor livre'}</p>
          </div>
        </div>

        {etapa === 'escolha' && (
          <form onSubmit={continuar}>
            {presente.descricao && <p className="presentear-desc">{presente.descricao}</p>}

            {formas.length === 0 ? (
              <p className="presentear-desc">Os anfitriões ainda não informaram como receber este presente.</p>
            ) : (
              <fieldset className="presentear-formas">
                <legend className="label">Como você quer presentear?</legend>
                {formas.map((f) => (
                  <label key={f.chave} className={`presentear-forma ${forma === f.chave ? 'sel' : ''}`}>
                    <input type="radio" name="forma" value={f.chave} checked={forma === f.chave} onChange={() => setForma(f.chave)} />
                    <span className="presentear-forma-icone"><Icone nome={f.icone} tamanho={17} /></span>
                    <span className="presentear-forma-texto">
                      <strong>{f.titulo}</strong>
                      <span>{f.texto}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            <div className="field">
              <label htmlFor="presentear-nome">Seu nome</label>
              <input id="presentear-nome" type="text" placeholder="Para os anfitriões saberem quem presenteou" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            {erro && <p className="erro-msg">{erro}</p>}

            <div className="popup-actions">
              <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={!forma || !nome.trim()}>
                {forma === 'loja' ? 'Reservar presente' : 'Continuar'}
              </button>
            </div>
          </form>
        )}

        {etapa === 'pagamento' && forma === 'pix' && (
          <div>
            <p className="presentear-desc">
              Abra o app do seu banco, escolha <strong>Pix copia e cola</strong> e cole o código abaixo. O valor de {moeda(presente.valor)} já vai preenchido.
            </p>
            <div className="pix-codigo">
              <code>{codigoPix}</code>
              <button type="button" className="btn btn-secondary btn-sm" onClick={copiarPix}>
                <Icone nome={copiado ? 'check' : 'copiar'} tamanho={14} /> {copiado ? 'Copiado' : 'Copiar código'}
              </button>
            </div>
            <p className="pix-chave">Chave Pix: <strong>{recebimento.chave}</strong> · {recebimento.nome}</p>
            {erro && <p className="erro-msg">{erro}</p>}
            <div className="popup-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEtapa('escolha')}>Voltar</button>
              <button type="button" className="btn btn-primary" onClick={concluir}><Icone nome="check" tamanho={15} /> Já fiz o Pix</button>
            </div>
          </div>
        )}

        {etapa === 'pagamento' && forma === 'cartao' && (
          <div>
            <p className="presentear-desc">
              Você será levado ao ambiente seguro de pagamento para pagar {moeda(presente.valor)} no cartão. Os dados do cartão não passam pelo HubEvent.
            </p>
            {erro && <p className="erro-msg">{erro}</p>}
            <div className="popup-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEtapa('escolha')} disabled={processando}>Voltar</button>
              <button type="button" className="btn btn-primary" onClick={pagarComCartao} disabled={processando}>
                {processando ? <><span className="carregando-anel" /> Processando…</> : <>Ir para o pagamento <Icone nome="seta" tamanho={15} /></>}
              </button>
            </div>
          </div>
        )}

        {etapa === 'feito' && (
          <div className="presentear-feito" role="status">
            <span className="presentear-feito-selo"><Icone nome="check" tamanho={22} traco={2} /></span>
            <h3 className="titulo">Presente reservado!</h3>
            <p>
              {forma === 'loja'
                ? `Obrigado, ${nome.trim()}. Agora é só concluir a compra na loja.`
                : `Obrigado, ${nome.trim()}. Os anfitriões vão adorar.`}
            </p>
            <div className="popup-actions">
              {forma === 'loja' ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={aoFechar}>Fechar</button>
                  <a className="btn btn-primary" href={presente.link} target="_blank" rel="noopener noreferrer">
                    Abrir a loja <Icone nome="abrir" tamanho={14} />
                  </a>
                </>
              ) : (
                <button type="button" className="btn btn-primary" onClick={aoFechar}>Fechar</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModalPresentear
