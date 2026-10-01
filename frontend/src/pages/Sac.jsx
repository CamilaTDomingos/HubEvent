import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import LayoutApp from '../components/LayoutApp'
import Icone from '../components/Icone'
import { CONTATOS, PERGUNTAS } from '../utils/sac'
import './Sac.css'

function formularioInicial(usuario) {
  return {
    nome: usuario?.user_metadata?.nome ?? '',
    email: usuario?.email ?? '',
    assunto: '',
    mensagem: '',
  }
}

function Sac() {
  const { usuario } = useAuth()
  const [aberta, setAberta] = useState(null)
  const [form, setForm] = useState(() => formularioInicial(usuario))
  const [enviada, setEnviada] = useState(false)

  function alterar(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Ainda não há backend para o SAC: o envio é apenas visual.
  // Quando houver, a chamada à API entra aqui.
  function enviar(e) {
    e.preventDefault()
    setEnviada(true)
  }

  function novaMensagem() {
    setForm(formularioInicial(usuario))
    setEnviada(false)
  }

  return (
    <LayoutApp>
      <header className="cab">
        <div className="rv">
          <p className="eyebrow">Atendimento</p>
          <h1 className="titulo">SAC</h1>
          <p className="cab-sub">Precisa de ajuda? Encontre respostas ou entre em contato com nossa equipe.</p>
        </div>
      </header>

      <div className="sac-grade">
        <div className="sac-principal">
          <section className="rv" style={{ '--d': 1 }} aria-labelledby="sac-faq">
            <div className="secao-cab">
              <h2 id="sac-faq">Perguntas frequentes</h2>
            </div>
            <ul className="faq painel">
              {PERGUNTAS.map((item, i) => {
                const expandida = aberta === i
                return (
                  <li key={item.pergunta} className={`faq-item ${expandida ? 'aberto' : ''}`}>
                    <button
                      className="faq-pergunta"
                      aria-expanded={expandida}
                      aria-controls={`faq-resposta-${i}`}
                      onClick={() => setAberta(expandida ? null : i)}
                    >
                      {item.pergunta}
                      <Icone nome="chevron" tamanho={16} />
                    </button>
                    {expandida && (
                      <p id={`faq-resposta-${i}`} className="faq-resposta">{item.resposta}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="rv" style={{ '--d': 3 }} aria-labelledby="sac-form">
            <div className="secao-cab">
              <h2 id="sac-form">Envie uma mensagem</h2>
            </div>
            <div className="sac-form painel">
              {enviada ? (
                <div className="sac-enviada" role="status">
                  <span className="vazio-icone"><Icone nome="check" tamanho={24} traco={2} /></span>
                  <p className="titulo">Mensagem enviada com sucesso!</p>
                  <p>Nossa equipe entrará em contato em breve.</p>
                  <button className="btn btn-secondary" onClick={novaMensagem}>Enviar outra mensagem</button>
                </div>
              ) : (
                <form onSubmit={enviar}>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="sac-nome">Nome</label>
                      <input id="sac-nome" name="nome" value={form.nome} onChange={alterar} autoComplete="name" required />
                    </div>
                    <div className="field">
                      <label htmlFor="sac-email">E-mail</label>
                      <input id="sac-email" name="email" type="email" value={form.email} onChange={alterar} autoComplete="email" required />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="sac-assunto">Assunto</label>
                    <input id="sac-assunto" name="assunto" value={form.assunto} onChange={alterar} placeholder="Sobre o que você quer falar?" required />
                  </div>
                  <div className="field">
                    <label htmlFor="sac-mensagem">Mensagem</label>
                    <textarea id="sac-mensagem" name="mensagem" rows={5} value={form.mensagem} onChange={alterar} placeholder="Conte com detalhes como podemos ajudar." required />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <Icone nome="enviar" tamanho={15} /> Enviar mensagem
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>

        <aside className="sac-contato painel rv" style={{ '--d': 2 }} aria-labelledby="sac-contato">
          <h2 id="sac-contato" className="titulo">Entre em contato</h2>
          <p className="sac-contato-sub">Prefere falar com a gente? Escolha um dos canais.</p>
          <ul className="sac-canais">
            {CONTATOS.map((c) => (
              <li key={c.chave}>
                <a
                  className="sac-canal"
                  href={c.href}
                  {...(c.href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  <span className="selo-tipo"><Icone nome={c.icone} tamanho={18} /></span>
                  <span className="sac-canal-texto">
                    <strong>{c.titulo}</strong>
                    <span>{c.descricao}</span>
                    <span className="sac-canal-valor">{c.valor}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </LayoutApp>
  )
}

export default Sac
