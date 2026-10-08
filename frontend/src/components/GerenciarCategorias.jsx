import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCategorias } from '../hooks/useCategorias'
import { corEmUso, proximaCor } from '../utils/coresCategoria'
import SeletorCor from './SeletorCor'
import SeloCategoria from './SeloCategoria'
import ModalConfirmacao from './ModalConfirmacao'
import Icone from './Icone'
import './Categorias.css'

function validar(categorias, { nome, cor }, ignorarId) {
  if (!nome.trim()) return 'Dê um nome para a categoria.'
  const mesmoNome = categorias.find((c) => c.id !== ignorarId && c.nome.toLowerCase() === nome.trim().toLowerCase())
  if (mesmoNome) return 'Já existe uma categoria com esse nome.'
  const mesmaCor = corEmUso(categorias, cor, ignorarId)
  if (mesmaCor) return `Essa cor já é da categoria "${mesmaCor.nome}". Escolha outra.`
  return null
}

// Formulário usado tanto para criar quanto para editar uma categoria.
function FormCategoria({ inicial, categorias, ignorarId, textoSalvar, aoSalvar, aoCancelar }) {
  const [nome, setNome] = useState(inicial.nome)
  const [cor, setCor] = useState(inicial.cor)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const problema = validar(categorias, { nome, cor }, ignorarId)
    if (problema) {
      setErro(problema)
      return
    }
    setSalvando(true)
    const falha = await aoSalvar({ nome: nome.trim(), cor })
    setSalvando(false)
    if (falha) setErro(falha)
  }

  return (
    <form className="cat-form" onSubmit={enviar}>
      <div className="cat-form-linha">
        <input
          className="input"
          type="text"
          placeholder="Nome da categoria"
          maxLength={60}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-label="Nome da categoria"
          autoFocus
        />
        <SeloCategoria categoria={{ nome: nome.trim() || 'Prévia', cor }} />
      </div>
      <SeletorCor valor={cor} aoMudar={setCor} categorias={categorias} ignorarId={ignorarId} />
      {erro && <p className="erro-msg">{erro}</p>}
      <div className="cat-form-acoes">
        {aoCancelar && <button type="button" className="btn btn-ghost btn-sm" onClick={aoCancelar}>Cancelar</button>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={salvando}>{salvando ? 'Salvando…' : textoSalvar}</button>
      </div>
    </form>
  )
}

// Painel do perfil para um tipo de categoria (tarefa ou despesa).
function GerenciarCategorias({ tabela, titulo, textoVazio, textoRemocao }) {
  const { usuario } = useAuth()
  const { categorias, carregando, erro, criar, editar, remover } = useCategorias(tabela)
  const [editando, setEditando] = useState(null)
  const [criando, setCriando] = useState(false)
  const [apagando, setApagando] = useState(null)

  async function confirmarRemocao() {
    if (!apagando) return
    await remover(apagando.id)
    setApagando(null)
  }

  return (
    <section className="painel cat-painel">
      <div className="painel-cab">
        <h3 className="titulo">{titulo}</h3>
        <span className="muted">{categorias.length} {categorias.length === 1 ? 'categoria' : 'categorias'}</span>
      </div>

      {carregando ? (
        <p className="muted painel-vazio">Carregando…</p>
      ) : erro ? (
        <p className="erro-msg cat-erro">Não foi possível carregar as categorias: {erro}</p>
      ) : (
        <ul className="cat-lista">
          {categorias.length === 0 && !criando && (
            <li className="cat-vazio">{textoVazio}</li>
          )}

          {categorias.map((c) =>
            editando === c.id ? (
              <li key={c.id} className="cat-linha editando">
                <FormCategoria
                  inicial={c}
                  categorias={categorias}
                  ignorarId={c.id}
                  textoSalvar="Salvar"
                  aoSalvar={async (dados) => {
                    const falha = await editar(c.id, dados)
                    if (!falha) setEditando(null)
                    return falha
                  }}
                  aoCancelar={() => setEditando(null)}
                />
              </li>
            ) : (
              <li key={c.id} className="cat-linha">
                <SeloCategoria categoria={c} />
                <div className="conv-acoes">
                  <button className="btn-icone" onClick={() => { setCriando(false); setEditando(c.id) }} title="Editar" aria-label={`Editar ${c.nome}`}>
                    <Icone nome="editar" tamanho={16} />
                  </button>
                  <button className="btn-icone perigo" onClick={() => setApagando(c)} title="Apagar" aria-label={`Apagar ${c.nome}`}>
                    <Icone nome="lixeira" tamanho={16} />
                  </button>
                </div>
              </li>
            )
          )}

          {criando ? (
            <li className="cat-linha editando">
              <FormCategoria
                inicial={{ nome: '', cor: proximaCor(categorias) }}
                categorias={categorias}
                textoSalvar="Criar categoria"
                aoSalvar={async (dados) => {
                  const falha = await criar({ ...dados, usuario_id: usuario.id })
                  if (!falha) setCriando(false)
                  return falha
                }}
                aoCancelar={() => setCriando(false)}
              />
            </li>
          ) : (
            <li>
              <button className="cat-nova" onClick={() => { setEditando(null); setCriando(true) }}>
                <span className="cat-nova-icone"><Icone nome="mais" tamanho={14} traco={2} /></span>
                Adicionar categoria
              </button>
            </li>
          )}
        </ul>
      )}

      <ModalConfirmacao
        aberto={!!apagando}
        titulo="Apagar categoria?"
        mensagem={textoRemocao(apagando?.nome)}
        textoConfirmar="Apagar"
        aoConfirmar={confirmarRemocao}
        aoCancelar={() => setApagando(null)}
      />
    </section>
  )
}

export default GerenciarCategorias
