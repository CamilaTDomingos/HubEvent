import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import PainelAuth from '../components/PainelAuth'
import Icone from '../components/Icone'
import './Auth.css'

function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleEnviar(e) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    setCarregando(false)

    // O Supabase não informa se o e-mail existe; só falhas de envio chegam aqui.
    if (error) {
      setErro(error.status === 429
        ? 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
        : 'Não foi possível enviar o e-mail agora. Tente novamente.')
      return
    }

    setEnviado(true)
  }

  const painel = (
    <PainelAuth
      titulo={
        <>
          Acontece com<br />
          <em>todo mundo.</em>
        </>
      }
      texto="Mandamos um link para você criar uma senha nova e voltar a organizar seus eventos."
    />
  )

  if (enviado) {
    return (
      <div className="auth">
        {painel}
        <div className="auth-lado">
          <div className="auth-form auth-ok">
            <span className="auth-ok-icone"><Icone nome="check" tamanho={24} traco={2} /></span>
            <p className="eyebrow">Confira seu e-mail</p>
            <h2 className="titulo">Link <em>enviado</em></h2>
            <p className="desc">
              Se existir uma conta com <strong>{email}</strong>, você vai receber um link para criar uma nova senha. Ele vale por tempo limitado.
            </p>
            <Link to="/login" className="btn btn-secondary">Voltar para o login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth">
      {painel}

      <div className="auth-lado">
        <div className="auth-form">
          <p className="eyebrow">Recuperar senha</p>
          <h2 className="titulo">Esqueceu <em>a senha?</em></h2>
          <p className="desc">Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>

          <form onSubmit={handleEnviar}>
            <div className="field">
              <label htmlFor="recuperar-email">E-mail</label>
              <input
                id="recuperar-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {erro && <p className="erro-msg">{erro}</p>}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={carregando}>
              {carregando ? 'Enviando…' : 'Enviar link de recuperação'}
            </button>
          </form>

          <p className="auth-troca">
            Lembrou? <Link to="/login">Voltar para o login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RecuperarSenha
