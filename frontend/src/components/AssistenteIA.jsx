import { useEffect, useRef, useState } from 'react'
import Icone from './Icone'
import { useAssistente } from '../hooks/useAssistente'
import { useCategorias } from '../hooks/useCategorias'
import { dataMedia } from '../utils/datas'
import './AssistenteIA.css'

// Assistente de IA de planejamento (RF02 / RF15): botão flutuante que abre o
// chat na lateral direita. Fica montado fora das abas, então a conversa
// continua aberta ao trocar de aba.

// Os códigos são os mesmos de ATALHOS em backend/src/routes/assistente.routes.js.
const ATALHOS = [
  { atalho: 'checklist', rotulo: 'Sugerir checklist', icone: 'check' },
  { atalho: 'cronograma', rotulo: 'Montar cronograma', icone: 'calendario' },
  { atalho: 'comida', rotulo: 'Estimar comida e bebida', icone: 'panela' },
  { atalho: 'fornecedores', rotulo: 'Fornecedores', icone: 'maleta' },
  { atalho: 'convite', rotulo: 'Redigir convite', icone: 'email' },
]

function SugestoesTarefas({ mensagem, categorias, aoAdicionar }) {
  const { tarefas, adicionadas = [] } = mensagem.dados
  const [selecionadas, setSelecionadas] = useState(() => tarefas.map((_, i) => i).filter((i) => !adicionadas.includes(i)))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const restantes = tarefas.length - adicionadas.length

  function alternar(i) {
    setSelecionadas((atuais) => (atuais.includes(i) ? atuais.filter((x) => x !== i) : [...atuais, i]))
  }

  async function adicionar() {
    setSalvando(true)
    setErro(null)
    const falha = await aoAdicionar(mensagem, [...selecionadas].sort((a, b) => a - b), categorias)
    if (falha) setErro(falha)
    else setSelecionadas([])
    setSalvando(false)
  }

  return (
    <div className="assist-tarefas">
      <p className="eyebrow">Tarefas sugeridas</p>
      <ul>
        {tarefas.map((t, i) => {
          const feita = adicionadas.includes(i)
          return (
            <li key={i} className={feita ? 'feita' : ''}>
              <label className="ck-marca">
                <input
                  type="checkbox"
                  checked={feita || selecionadas.includes(i)}
                  disabled={feita || salvando}
                  onChange={() => alternar(i)}
                  aria-label={feita ? `"${t.titulo}" já está no checklist` : `Escolher "${t.titulo}"`}
                />
                <span className="ck-caixa"><Icone nome="check" tamanho={13} traco={2.2} /></span>
              </label>
              <div className="assist-tarefa-texto">
                <strong>{t.titulo}</strong>
                <span>
                  {feita ? 'No checklist' : [t.prazo && dataMedia(t.prazo), t.categoria].filter(Boolean).join(' · ') || 'Sem prazo'}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      {restantes > 0 ? (
        <button className="btn btn-primary btn-sm btn-block" onClick={adicionar} disabled={salvando || selecionadas.length === 0}>
          <Icone nome="mais" tamanho={14} />
          {salvando
            ? 'Adicionando…'
            : selecionadas.length === 0
              ? 'Escolha as tarefas'
              : `Adicionar ${selecionadas.length} ao checklist`}
        </button>
      ) : (
        <p className="assist-tarefas-ok"><Icone nome="check" tamanho={14} traco={2} /> Tudo adicionado ao checklist</p>
      )}
      {erro && <p className="erro-msg">{erro}</p>}
    </div>
  )
}

function AssistenteIA({ eventoId, aoAdicionarTarefas }) {
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const { mensagens, carregando, erroHistorico, recarregar, pendente, falha, enviar, tentarDeNovo, adicionarTarefas } = useAssistente(eventoId)
  const { categorias } = useCategorias()
  const listaRef = useRef(null)
  const campoRef = useRef(null)
  const ocupado = Boolean(pendente)

  // Rola para a mensagem mais nova sempre que a conversa muda.
  useEffect(() => {
    const lista = listaRef.current
    if (lista) lista.scrollTop = lista.scrollHeight
  }, [aberto, mensagens, pendente, falha])

  useEffect(() => {
    if (!aberto) return
    campoRef.current?.focus()
    const aoTeclar = (e) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  function enviarTexto(e) {
    e.preventDefault()
    const mensagem = texto.trim()
    if (!mensagem || ocupado) return
    setTexto('')
    enviar({ mensagem })
  }

  async function adicionar(mensagem, indices, cats) {
    const erro = await adicionarTarefas(mensagem, indices, cats)
    if (!erro) aoAdicionarTarefas?.()
    return erro
  }

  if (!aberto) {
    return (
      <button className="assist-botao" onClick={() => setAberto(true)} aria-label="Abrir o Assistente HubEvent">
        <Icone nome="brilho" tamanho={18} />
        <span>Assistente</span>
      </button>
    )
  }

  return (
    <section className="assist-painel" role="dialog" aria-label="Assistente HubEvent">
      <header className="assist-cab">
        <span className="assist-avatar"><Icone nome="brilho" tamanho={18} /></span>
        <div>
          <h2 className="titulo">Assistente HubEvent</h2>
          <p>Planejamento com IA</p>
        </div>
        <button className="btn-icone" onClick={() => setAberto(false)} aria-label="Fechar o assistente" title="Fechar">
          <Icone nome="fechar" tamanho={18} />
        </button>
      </header>

      <div className="assist-mensagens" ref={listaRef} aria-live="polite">
        <div className="assist-balao ia">
          <p className="assist-texto">
            Olá! Sou o assistente do HubEvent. Posso sugerir tarefas para o checklist, montar um cronograma, estimar comida e
            bebida pelos confirmados, indicar fornecedores e redigir o convite.
          </p>
        </div>

        {carregando ? (
          <p className="assist-aviso">Carregando a conversa…</p>
        ) : erroHistorico ? (
          <div className="assist-erro">
            <p>{erroHistorico}</p>
            <button className="btn btn-secondary btn-sm" onClick={recarregar}>Tentar de novo</button>
          </div>
        ) : (
          mensagens.map((m) => (
            <div key={m.id} className={`assist-balao ${m.tipo === 'USUARIO' ? 'usuario' : 'ia'}`}>
              <p className="assist-texto">{m.conteudo}</p>
              {m.tipo === 'IA' && m.dados?.tarefas?.length > 0 && (
                <SugestoesTarefas mensagem={m} categorias={categorias} aoAdicionar={adicionar} />
              )}
            </div>
          ))
        )}

        {pendente && (
          <>
            <div className="assist-balao usuario"><p className="assist-texto">{pendente}</p></div>
            <div className="assist-balao ia assist-digitando" aria-label="O assistente está escrevendo">
              <span /><span /><span />
            </div>
          </>
        )}

        {falha && (
          <div className="assist-erro" role="alert">
            <p>{falha.mensagem}</p>
            <button className="btn btn-secondary btn-sm" onClick={tentarDeNovo}>Tentar de novo</button>
          </div>
        )}
      </div>

      <div className="assist-atalhos" role="group" aria-label="Atalhos rápidos">
        {ATALHOS.map((a) => (
          <button key={a.atalho} className="assist-atalho" onClick={() => enviar(a)} disabled={ocupado}>
            <Icone nome={a.icone} tamanho={14} />
            {a.rotulo}
          </button>
        ))}
      </div>

      <form className="assist-rodape" onSubmit={enviarTexto}>
        <textarea
          ref={campoRef}
          className="input"
          rows={1}
          maxLength={2000}
          placeholder="Pergunte algo sobre o evento…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) enviarTexto(e)
          }}
          aria-label="Mensagem para o assistente"
        />
        <button className="btn btn-primary assist-enviar" type="submit" disabled={ocupado || !texto.trim()} aria-label="Enviar">
          <Icone nome="enviar" tamanho={17} />
        </button>
      </form>
      <p className="assist-nota">A IA pode errar. Do evento, ela recebe só números e títulos de tarefas; não escreva aqui nomes ou contatos de convidados.</p>
    </section>
  )
}

export default AssistenteIA
