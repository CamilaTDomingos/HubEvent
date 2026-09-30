import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import PainelAuth from '../components/PainelAuth'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    setCarregando(false)

    if (error) {
      setErro(error.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="auth">
      <PainelAuth
        titulo={
          <>
            Organize.<br />
            Celebre.<br />
            <em>Lembre.</em>
          </>
        }
        texto="Convidados, presentes, checklist e orçamento do seu evento — tudo num lugar só."
      />

      <div className="auth-lado">
        <div className="auth-form">
          <p className="eyebrow">Entrar</p>
          <h2 className="titulo">Bem-vindo <em>de volta</em></h2>
          <p className="desc">Entre na sua conta para continuar organizando seus eventos.</p>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="login-senha">Senha</label>
              <input
                id="login-senha"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {erro && <p className="erro-msg">{erro}</p>}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={carregando}>
              {carregando ? 'Entrando…' : 'Entrar na plataforma'}
            </button>
          </form>

          <p className="auth-troca">
            Ainda não tem conta? <Link to="/cadastro">Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
