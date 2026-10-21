import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import LayoutApp from '../components/LayoutApp'
import Icone from '../components/Icone'
import Carregando from '../components/Carregando'
import { useSac } from '../hooks/useSac'
import { formatar } from '../utils/datas'
import { CONTATOS, PERGUNTAS, LIMITES, STATUS_SAC, validarMensagem, segundosParaNovoEnvio } from '../utils/sac'
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
  const [enviando, setEnviando] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const { mensagens, carregando, erro, enviar: enviarMensagem } = useSac()

  function alterar(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function enviar(e) {
    e.preventDefault()
    if (enviando) return

    const invalido = validarMensagem(form)
    if (invalido) return setErroForm(invalido)

    // O banco também recusa; aqui só poupa a ida ao servidor.
    const espera = segundosParaNovoEnvio(mensagens[0]?.criado_em)
    if (espera > 0) return setErroForm(`Você acabou de enviar uma mensagem. Aguarde ${espera} s para enviar outra.`)

    setEnviando(true)
    const falha = await enviarMensagem({
      usuario_id: usuario.id,
      nome: form.nome.trim(),
      email: form.email.trim(),
      assunto: form.assunto.trim(),
      mensagem: form.mensagem.trim(),
    })
    setEnviando(false)

    // Em caso de erro o formulário fica preenchido para tentar de novo.
    setErroForm(falha)
    if (!falha) setEnviada(true)
  }

  function novaMensagem() {
    setForm(formularioInicial(usuario))
    setErroForm(null)
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
                  <p>Nossa equipe entrará em contato em breve. Acompanhe o andamento em Minhas solicitações.</p>
                  <button className="btn btn-secondary" onClick={novaMensagem}>Enviar outra mensagem</button>
                </div>
              ) : (
                <form onSubmit={enviar} noValidate>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="sac-nome">Nome</label>
                      <input id="sac-nome" name="nome" value={form.nome} onChange={alterar} autoComplete="name" maxLength={LIMITES.nome} required />
                    </div>
                    <div className="field">
                      <label htmlFor="sac-email">E-mail</label>
                      <input id="sac-email" name="email" type="email" value={form.email} onChange={alterar} autoComplete="email" maxLength={LIMITES.email} required />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="sac-assunto">Assunto</label>
                    <input id="sac-assunto" name="assunto" value={form.assunto} onChange={alterar} placeholder="Sobre o que você quer falar?" maxLength={LIMITES.assunto} required />
                  </div>
                  <div className="field">
                    <label htmlFor="sac-mensagem">Mensagem</label>
                    <textarea id="sac-mensagem" name="mensagem" rows={5} value={form.mensagem} onChange={alterar} placeholder="Conte com detalhes como podemos ajudar." maxLength={LIMITES.mensagem} aria-describedby="sac-mensagem-contador" required />
                    <p id="sac-mensagem-contador" className="sac-contador">{form.mensagem.length}/{LIMITES.mensagem}</p>
                  </div>
                  {erroForm && <p className="erro-msg" role="alert">{erroForm}</p>}
                  <button type="submit" className="btn btn-primary" disabled={enviando}>
                    <Icone nome="enviar" tamanho={15} /> {enviando ? 'Enviando…' : 'Enviar mensagem'}
                  </button>
                </form>
              )}
            </div>
          </section>

          <section className="rv" style={{ '--d': 4 }} aria-labelledby="sac-historico">
            <div className="secao-cab">
              <h2 id="sac-historico">Minhas solicitações</h2>
            </div>
            {carregando ? (
              <Carregando texto="Buscando suas solicitações…" />
            ) : erro ? (
              <p className="erro-msg">{erro}</p>
            ) : mensagens.length === 0 ? (
              <p className="sac-historico-vazio painel">Você ainda não enviou nenhuma mensagem.</p>
            ) : (
              <ul className="sac-historico painel">
                {mensagens.map((m) => {
                  const status = STATUS_SAC[m.status] ?? STATUS_SAC.ABERTA
                  return (
                    <li key={m.id} className="sac-solicitacao">
                      <div className="sac-solicitacao-cab">
                        <strong>{m.assunto}</strong>
                        <span className={`badge ${status.classe}`}>{status.rotulo}</span>
                      </div>
                      <p className="sac-solicitacao-data">
                        Enviada em {formatar(m.criado_em, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="sac-solicitacao-texto">{m.mensagem}</p>
                      {m.resposta && (
                        <div className="sac-resposta">
                          <span>Resposta da equipe</span>
                          <p>{m.resposta}</p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
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
