import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useConvidados } from '../hooks/useConvidados'
import { useDespesas } from '../hooks/useDespesas'
import LayoutApp from '../components/LayoutApp'
import AbasEvento from '../components/AbasEvento'
import AbaConvidados from '../components/AbaConvidados'
import AbaFinanceiro from '../components/AbaFinanceiro'
import Forma from '../components/Forma'
import Carregando from '../components/Carregando'
import { tipoEvento } from '../utils/categorias'
import { diasAte, dataLonga, hora } from '../utils/datas'
import './EventoDetalhe.css'

function Carimbo({ dataInicio }) {
  const dias = diasAte(dataInicio)
  let topo = 'faltam'
  let meio = dias
  let base = dias === 1 ? 'dia' : 'dias'

  if (dias === 0) {
    topo = 'é'
    meio = 'hoje'
    base = 'bora!'
  } else if (dias < 0) {
    topo = 'foi há'
    meio = Math.abs(dias)
    base = Math.abs(dias) === 1 ? 'dia' : 'dias'
  }

  return (
    <div className={`carimbo ${dias < 0 ? 'passou' : ''}`} aria-label={`${topo} ${meio} ${base}`}>
      <span className="mono">{topo}</span>
      <strong className="display">{meio}</strong>
      <span className="mono">{base}</span>
    </div>
  )
}

function EventoDetalhe() {
  const { id } = useParams()
  const [aba, setAba] = useState('convidados')
  const [evento, setEvento] = useState(null)

  const convidados = useConvidados(id)
  const despesas = useDespesas(id)

  useEffect(() => {
    async function buscarEvento() {
      const { data } = await supabase.from('evento').select('*').eq('id', id).single()
      setEvento(data)
    }
    buscarEvento()
  }, [id])

  if (!evento) {
    return (
      <LayoutApp>
        <Carregando texto="Abrindo o evento…" />
      </LayoutApp>
    )
  }

  const tipo = tipoEvento(evento.categoria)
  const horario = hora(evento.data_inicio)

  return (
    <LayoutApp>
      <Link to="/eventos" className="voltar">← Agenda</Link>

      <header className="ev-topo">
        <div className="ev-topo-texto">
          <p className="eyebrow ev-topo-tipo rv">
            <Forma tipo={tipo.forma} cor={tipo.cor} tamanho={18} contorno />
            {evento.categoria || 'Evento'}
          </p>
          <h1 className="display ev-topo-nome rv" style={{ '--d': 1 }}>{evento.nome}</h1>
          <p className="ev-topo-meta rv" style={{ '--d': 2 }}>
            <span>{dataLonga(evento.data_inicio)}</span>
            {horario && <span>{horario}</span>}
            {evento.local && <span>{evento.local}</span>}
          </p>
        </div>
        <Carimbo dataInicio={evento.data_inicio} />
      </header>

      <AbasEvento
        aba={aba}
        aoTrocar={setAba}
        eventoId={id}
        totalConvidados={convidados.convidados.length}
        totalDespesas={despesas.despesas.length}
      />

      <div className="aba-conteudo" key={aba}>
        {aba === 'convidados' && (
          <AbaConvidados
            eventoId={id}
            convidados={convidados.convidados}
            carregando={convidados.carregando}
            recarregar={convidados.recarregar}
          />
        )}

        {aba === 'financeiro' && (
          <AbaFinanceiro
            evento={evento}
            despesas={despesas.despesas}
            carregando={despesas.carregando}
            recarregar={despesas.recarregar}
            aoAtualizarOrcamento={(valor) => setEvento((atual) => ({ ...atual, orcamento_estimado: valor }))}
          />
        )}
      </div>
    </LayoutApp>
  )
}

export default EventoDetalhe
