import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    setCarregando(false)

    if (error) {
      setErro(error.message)
      return
    }

    console.log('Login OK:', data)
  }

  return (
    <div className="auth-screen">
      <div className="auth-left">
        <div className="auth-deco d1"></div>
        <div className="auth-deco d2"></div>
        <div className="auth-brand">
          <div className="auth-brand-mark"></div>
          <div>
            <div className="auth-brand-text">HubEvent</div>
            <div className="auth-brand-sub">Platform</div>
          </div>
        </div>
        <div className="auth-hero">
          <div className="auth-h1">Organize.<br />Celebre.<br /><em>Lembre.</em></div>
          <p className="auth-sub">
            Gerencie convidados, presentes, checklist e orçamento em um só lugar — com inteligência artificial.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-ey">Acesso seguro</div>
          <h1>Bem-vindo de volta</h1>
          <p className="a-desc">Entre na sua conta para continuar organizando seus eventos</p>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {erro && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar na plataforma →'}
            </button>
          </form>

          <p className="auth-switch">Não tem conta? <a>Criar conta grátis</a></p>
        </div>
      </div>
    </div>
  )
}

export default Login