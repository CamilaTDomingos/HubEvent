import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import PainelAuth from '../components/PainelAuth'
import Carregando from '../components/Carregando'
import './Auth.css'

const SENHA_MINIMA = 6

// Página aberta pelo link do e-mail. O Supabase lê o token da URL e cria
// uma sessão de recuperação; sem ela, o link é inválido ou expirou.
function RedefinirSenha() {
  const navigate = useNavigate()
  const { usuario, carregando } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar(e) {
    e.preventDefault()
    setErro(null)

    if (senha.length < SENHA_MINIMA) {
      setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
      return
    }
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.')
      return
    }

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)

    if (error) {
      setErro(error.code === 'same_password'
        ? 'A nova senha precisa ser diferente da anterior.'
        : 'Não foi possível salvar a nova senha. Tente novamente.')
      return
    }

    navigate('/dashboard')
  }

  if (carregando) return <Carregando texto="Validando o link…" telaCheia />

  const painel = (
    <PainelAuth
      titulo={
        <>
          Nova senha,<br />
          <em>mesmos eventos.</em>
        </>
      }
      texto="Escolha uma senha nova. Tudo o que você já organizou continua do jeito que estava."
    />
  )

  if (!usuario) {
    return (
      <div className="auth">
        {painel}
        <div className="auth-lado">
          <div className="auth-form">
            <p className="eyebrow">Link inválido</p>
            <h2 className="titulo">Este link <em>expirou</em></h2>
            <p className="desc">O link de recuperação já foi usado ou passou do prazo. Peça um novo para continuar.</p>
            <Link to="/recuperar-senha" className="btn btn-primary btn-lg btn-block">Pedir um novo link</Link>
            <p className="auth-troca">
              <Link to="/login">Voltar para o login</Link>
            </p>
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
          <p className="eyebrow">Redefinir senha</p>
          <h2 className="titulo">Crie uma <em>nova senha</em></h2>
          <p className="desc">Conta: <strong>{usuario.email}</strong></p>

          <form onSubmit={handleSalvar}>
            <div className="field">
              <label htmlFor="nova-senha">Nova senha</label>
              <input
                id="nova-senha"
                type="password"
                placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirma-senha">Confirmar nova senha</label>
              <input
                id="confirma-senha"
                type="password"
                placeholder="Repita a senha"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                required
              />
            </div>

            {erro && <p className="erro-msg">{erro}</p>}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RedefinirSenha
