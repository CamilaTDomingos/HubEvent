import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Login.css'
import './Cadastro.css'

function Cadastro() {
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(true)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleCadastro(e) {
    e.preventDefault()
    setErro(null)

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    if (senha.length < 8) {
      setErro('A senha precisa ter no mínimo 8 caracteres.')
      return
    }
    if (!aceitouTermos) {
      setErro('É necessário aceitar os Termos de Uso.')
      return
    }

    setCarregando(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome: nome,
          sobrenome: sobrenome,
        },
      },
    })

    setCarregando(false)

    if (error) {
      setErro(error.message)
      return
    }

    console.log('Cadastro OK:', data)
    setSucesso(true)
  }

  if (sucesso) {
    return (
      <div className="auth-screen">
        <div className="auth-right" style={{ width: '100%' }}>
          <div className="auth-card">
            <div className="auth-ey">Quase lá</div>
            <h1>Confirme seu e-mail</h1>
            <p className="a-desc">
              Enviamos um link de confirmação para {email}. Verifique sua caixa de entrada para ativar sua conta.
            </p>
          </div>
        </div>
      </div>
    )
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
          <div className="auth-h1">Comece<br />seu primeiro<br /><em>evento.</em></div>
          <p className="auth-sub">Crie sua conta em menos de 2 minutos e organize com toda estrutura que precisa.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-ey">Cadastro gratuito</div>
          <h1>Criar sua conta</h1>
          <p className="a-desc">Preencha os dados e comece a organizar agora</p>

          <form onSubmit={handleCadastro}>
            <div className="field-row">
              <div className="field">
                <label>Nome</label>
                <input type="text" placeholder="Ana" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="field">
                <label>Sobrenome</label>
                <input type="text" placeholder="Lima" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>E-mail</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Senha</label>
                <input type="password" placeholder="Mín. 8 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} required />
              </div>
              <div className="field">
                <label>Confirmar</label>
                <input type="password" placeholder="••••••••" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />
              </div>
            </div>

            <div className="chk-row">
              <input
                type="checkbox"
                id="terms"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
              />
              <label htmlFor="terms">
                Concordo com os <a href="#">Termos de Uso</a> e <a href="#">Política de Privacidade</a>
              </label>
            </div>

            {erro && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={carregando}>
              {carregando ? 'Criando conta...' : 'Criar conta grátis →'}
            </button>
          </form>

          <p className="auth-switch">Já tem conta? <a>Entrar →</a></p>
        </div>
      </div>
    </div>
  )
}

export default Cadastro