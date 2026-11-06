import { useState } from 'react'
import LayoutApp from '../components/LayoutApp'
import GerenciarCategorias from '../components/GerenciarCategorias'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Perfil.css'

// Edita apenas dados de perfil (nome e sobrenome, guardados em user_metadata).
// E-mail e senha ficam de fora para não interferir no login.
function DadosUsuario() {
  const { usuario } = useAuth()
  const meta = usuario?.user_metadata ?? {}
  const [nome, setNome] = useState(meta.nome ?? '')
  const [sobrenome, setSobrenome] = useState(meta.sobrenome ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [ok, setOk] = useState(false)

  const alterado = nome.trim() !== (meta.nome ?? '') || sobrenome.trim() !== (meta.sobrenome ?? '')

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    setOk(false)
    if (!nome.trim()) {
      setErro('Informe seu nome.')
      return
    }
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({
      data: { nome: nome.trim(), sobrenome: sobrenome.trim() },
    })
    setSalvando(false)
    if (error) setErro(error.message)
    else setOk(true)
  }

  const iniciais = ((meta.nome?.[0] ?? usuario?.email?.[0] ?? '?') + (meta.sobrenome?.[0] ?? '')).toUpperCase()

  return (
    <section className="perfil-card">
      <div className="perfil-id">
        <span className="perfil-avatar">{iniciais}</span>
        <div>
          <h2 className="perfil-nome">{[meta.nome, meta.sobrenome].filter(Boolean).join(' ') || 'Sem nome'}</h2>
          <p className="perfil-email">{usuario?.email}</p>
        </div>
      </div>

      <form onSubmit={salvar}>
        <div className="field">
          <label htmlFor="perfil-nome">Nome</label>
          <input id="perfil-nome" type="text" autoComplete="given-name" value={nome} onChange={(e) => { setNome(e.target.value); setOk(false) }} required />
        </div>
        <div className="field">
          <label htmlFor="perfil-sobrenome">Sobrenome</label>
          <input id="perfil-sobrenome" type="text" autoComplete="family-name" value={sobrenome} onChange={(e) => { setSobrenome(e.target.value); setOk(false) }} />
        </div>
        <div className="field">
          <label htmlFor="perfil-email">E-mail (usado no login)</label>
          <input id="perfil-email" type="email" value={usuario?.email ?? ''} disabled />
        </div>
        {erro && <p className="erro-msg">{erro}</p>}
        {ok && <p className="perfil-ok">Dados atualizados.</p>}
        <button type="submit" className="btn btn-primary" disabled={salvando || !alterado}>
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>
    </section>
  )
}

function Perfil() {
  return (
    <LayoutApp>
      <header className="cab">
        <div className="rv">
          <p className="eyebrow">Sua conta</p>
          <h1 className="titulo">Perfil</h1>
        </div>
      </header>

      <div className="perfil-grade">
        <aside className="perfil-esquerda">
          <DadosUsuario />
        </aside>

        <div className="perfil-direita">
          <GerenciarCategorias
            tabela="categoria_tarefa"
            titulo="Categorias de tarefas"
            textoVazio="Nenhuma categoria ainda. Crie categorias para organizar as tarefas do checklist."
            textoRemocao={(nome) => `As tarefas marcadas como "${nome}" não serão apagadas, só ficarão sem categoria.`}
          />
          <GerenciarCategorias
            tabela="categoria_despesa"
            titulo="Categorias de despesas"
            textoVazio="Nenhuma categoria ainda. Crie categorias para separar os gastos no financeiro."
            textoRemocao={(nome) => `As despesas marcadas como "${nome}" não serão apagadas, só ficarão sem categoria.`}
          />
        </div>
      </div>
    </LayoutApp>
  )
}

export default Perfil
