import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ModalConfirmacao from './ModalConfirmacao'
import NumeroAnimado from './NumeroAnimado'
import Icone from './Icone'
import { diasAte, dataMedia, rotuloContagem } from '../utils/datas'

const concluida = (t) => t.status === 'CONCLUIDA'
const atrasada = (t) => !concluida(t) && t.prazo && diasAte(t.prazo) < 0

const FILTROS = {
  PENDENTES: { label: 'Pendentes', teste: (t) => !concluida(t) },
  ATRASADAS: { label: 'Atrasadas', teste: atrasada },
  CONCLUIDAS: { label: 'Concluídas', teste: concluida },
}

function AbaChecklist({ eventoId, tarefas, carregando, recarregar }) {
  const [titulo, setTitulo] = useState('')
  const [prazo, setPrazo] = useState('')
  const [filtro, setFiltro] = useState(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)

  const contagem = Object.fromEntries(Object.entries(FILTROS).map(([f, info]) => [f, tarefas.filter(info.teste).length]))
  const total = tarefas.length
  const percentual = total ? Math.round((contagem.CONCLUIDAS / total) * 100) : 0
  const lista = filtro ? tarefas.filter(FILTROS[filtro].teste) : tarefas

  async function handleAdicionarTarefa(e) {
    e.preventDefault()
    if (!titulo.trim()) return

    const { error } = await supabase.from('tarefa').insert({
      evento_id: eventoId,
      titulo: titulo.trim(),
      prazo: prazo || null,
    })

    if (!error) {
      setTitulo('')
      setPrazo('')
      recarregar()
    }
  }

  async function alternar(tarefa) {
    const { error } = await supabase
      .from('tarefa')
      .update({ status: concluida(tarefa) ? 'PENDENTE' : 'CONCLUIDA' })
      .eq('id', tarefa.id)
    if (!error) recarregar()
  }

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return
    const { error } = await supabase.from('tarefa').delete().eq('id', confirmandoExclusao)
    if (!error) recarregar()
    setConfirmandoExclusao(null)
  }

  return (
    <div className="conv">
      <aside className="conv-lateral">
        <section className="painel rsvp-resumo">
          <p className="eyebrow">Progresso</p>
          <div className="rsvp-numero">
            <strong className="titulo num"><NumeroAnimado valor={contagem.CONCLUIDAS} casas={0} /></strong>
            <span className="rsvp-de">de {total} {total === 1 ? 'tarefa' : 'tarefas'}</span>
            <span className="rsvp-pct">{percentual}%</span>
          </div>

          <div className="medidor-trilho check-medidor" aria-hidden="true">
            <div className="medidor-fill" style={{ width: `${percentual}%` }} />
          </div>

          <div className="filtro-status" role="group" aria-label="Filtrar tarefas">
            {Object.entries(FILTROS).map(([f, info]) => (
              <button
                key={f}
                className={`filtro-item ck-${f.toLowerCase()} ${filtro === f ? 'sel' : ''}`}
                aria-pressed={filtro === f}
                onClick={() => setFiltro(filtro === f ? null : f)}
              >
                <span className="ponto" />
                {info.label}
                <strong className="num">{contagem[f]}</strong>
              </button>
            ))}
          </div>
        </section>

        <form className="convidar" onSubmit={handleAdicionarTarefa}>
          <h3 className="titulo">Nova tarefa</h3>
          <div className="field">
            <label htmlFor="tarefa-titulo">Tarefa</label>
            <input id="tarefa-titulo" type="text" placeholder="Ex.: Fechar o buffet" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="tarefa-prazo">Prazo <span className="muted">(opcional)</span></label>
            <input id="tarefa-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block"><Icone nome="mais" tamanho={16} /> Adicionar</button>
        </form>
      </aside>

      <section className="painel conv-principal">
        <div className="painel-cab">
          <h3 className="titulo">{filtro ? FILTROS[filtro].label : 'Checklist'}</h3>
          {filtro ? (
            <button className="link" onClick={() => setFiltro(null)}>Mostrar todas</button>
          ) : (
            <span className="muted">{contagem.PENDENTES} {contagem.PENDENTES === 1 ? 'pendente' : 'pendentes'}</span>
          )}
        </div>

        {carregando ? (
          <p className="muted painel-vazio">Carregando…</p>
        ) : lista.length === 0 ? (
          <div className="painel-vazio">
            <Icone nome="check" tamanho={26} />
            <p>{total === 0 ? 'Nenhuma tarefa ainda. Adicione a primeira ao lado.' : 'Nenhuma tarefa nesse filtro.'}</p>
          </div>
        ) : (
          <ul className="conv-lista">
            {lista.map((t, i) => (
              <li key={t.id} className={`ck-linha ${concluida(t) ? 'feita' : ''}`} style={{ '--i': i }}>
                <label className="ck-marca">
                  <input type="checkbox" checked={concluida(t)} onChange={() => alternar(t)} aria-label={`Marcar "${t.titulo}" como ${concluida(t) ? 'pendente' : 'concluída'}`} />
                  <span className="ck-caixa"><Icone nome="check" tamanho={14} traco={2.2} /></span>
                </label>
                <div className="conv-nome">
                  <strong>{t.titulo}</strong>
                  {t.prazo ? (
                    <span className={atrasada(t) ? 'ck-atrasada' : ''}>
                      <span className="capitalizar">{dataMedia(t.prazo)}</span>
                      {!concluida(t) && ` · ${rotuloContagem(t.prazo)}`}
                    </span>
                  ) : (
                    <span>Sem prazo</span>
                  )}
                </div>
                <div className="conv-acoes">
                  <button className="btn-icone perigo" onClick={() => setConfirmandoExclusao(t.id)} title="Remover" aria-label={`Remover ${t.titulo}`}>
                    <Icone nome="lixeira" tamanho={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalConfirmacao
        aberto={!!confirmandoExclusao}
        titulo="Remover tarefa?"
        mensagem="Tem certeza que deseja remover essa tarefa? Essa ação não pode ser desfeita."
        textoConfirmar="Remover"
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setConfirmandoExclusao(null)}
      />
    </div>
  )
}

export default AbaChecklist
