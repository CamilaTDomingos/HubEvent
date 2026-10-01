import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ModalConfirmacao from './ModalConfirmacao'
import ModalTarefa from './ModalTarefa'
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
  const [criando, setCriando] = useState(false)
  const [filtro, setFiltro] = useState(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)

  const contagem = Object.fromEntries(Object.entries(FILTROS).map(([f, info]) => [f, tarefas.filter(info.teste).length]))
  const total = tarefas.length
  const percentual = total ? Math.round((contagem.CONCLUIDAS / total) * 100) : 0
  const lista = filtro ? tarefas.filter(FILTROS[filtro].teste) : tarefas
  // Uma tarefa nova entra como pendente, então só faz sentido oferecer a
  // linha de adicionar onde ela vai aparecer.
  const mostraLinhaNova = !filtro || filtro === 'PENDENTES'

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

        <button className="btn btn-primary btn-block" onClick={() => setCriando(true)}>
          <Icone nome="mais" tamanho={16} /> Nova tarefa
        </button>
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
        ) : total === 0 ? (
          <button className="painel-vazio ck-vazio" onClick={() => setCriando(true)}>
            <span className="ck-vazio-icone"><Icone nome="mais" tamanho={22} /></span>
            <strong>Adicionar nova tarefa</strong>
            <span>Monte o checklist do que precisa estar pronto até o dia.</span>
          </button>
        ) : (
          <ul className="conv-lista">
            {lista.length === 0 && <li className="painel-vazio">Nenhuma tarefa nesse filtro.</li>}
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
            {mostraLinhaNova && (
              <li>
                <button className="ck-linha ck-nova" onClick={() => setCriando(true)}>
                  <span className="ck-caixa"><Icone nome="mais" tamanho={14} traco={2} /></span>
                  Adicionar tarefa
                </button>
              </li>
            )}
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

      <ModalTarefa aberto={criando} eventoId={eventoId} aoFechar={() => setCriando(false)} aoSalvar={recarregar} />
    </div>
  )
}

export default AbaChecklist
