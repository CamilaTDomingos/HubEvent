import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'
import PainelAuth from '../components/PainelAuth'
import Icone from '../components/Icone'
import './Auth.css'

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

    const { error } = await supabase.auth.signUp({
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

    setSucesso(true)
  }

  const painel = (
    <PainelAuth
      titulo={
        <>
          Comece seu<br />
          primeiro <em>evento.</em>
        </>
      }
      texto="Crie sua conta em menos de dois minutos e tenha toda a estrutura para organizar do seu jeito."
    />
  )

  if (sucesso) {
    return (
      <div className="auth">
        {painel}
        <div className="auth-lado">
          <div className="auth-form auth-ok">
            <span className="auth-ok-icone"><Icone nome="check" tamanho={24} traco={2} /></span>
            <p className="eyebrow">Quase lá</p>
            <h2 className="titulo">Confirme seu <em>e-mail</em></h2>
            <p className="desc">
              Enviamos um link de confirmação para <strong>{email}</strong>. Abra sua caixa de entrada para ativar a conta.
            </p>
            <Link to="/login" className="btn btn-secondary">Ir para o login</Link>
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
          <p className="eyebrow">Cadastro gratuito</p>
          <h2 className="titulo">Criar sua <em>conta</em></h2>
          <p className="desc">Preencha seus dados e comece a organizar agora.</p>

          <form onSubmit={handleCadastro}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="cad-nome">Nome</label>
                <input id="cad-nome" type="text" placeholder="Ana" autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="cad-sobrenome">Sobrenome</label>
                <input id="cad-sobrenome" type="text" placeholder="Lima" autoComplete="family-name" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="cad-email">E-mail</label>
              <input id="cad-email" type="email" placeholder="seu@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="cad-senha">Senha</label>
                <input id="cad-senha" type="password" placeholder="Mín. 8 caracteres" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="cad-confirmar">Confirmar</label>
                <input id="cad-confirmar" type="password" placeholder="••••••••" autoComplete="new-password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />
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
                Concordo com os <a href="#">Termos de Uso</a> e a <a href="#">Política de Privacidade</a>
              </label>
            </div>

            {erro && <p className="erro-msg">{erro}</p>}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={carregando}>
              {carregando ? 'Criando conta…' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="auth-troca">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Cadastro
