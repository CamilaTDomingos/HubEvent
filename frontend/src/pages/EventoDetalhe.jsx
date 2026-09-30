import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useConvidados } from '../hooks/useConvidados'
import { useDespesas } from '../hooks/useDespesas'
import { usePresentes } from '../hooks/usePresentes'
import LayoutApp from '../components/LayoutApp'
import AbasEvento from '../components/AbasEvento'
import AbaConvidados from '../components/AbaConvidados'
import AbaFinanceiro from '../components/AbaFinanceiro'
import AbaPresentes from '../components/AbaPresentes'
import Icone from '../components/Icone'
import Carregando from '../components/Carregando'
import { tipoEvento } from '../utils/categorias'
import { diasAte, dataLonga, hora } from '../utils/datas'
import './EventoDetalhe.css'

function Contagem({ dataInicio }) {
  const dias = diasAte(dataInicio)
  if (dias < 0) {
    return (
      <div className="contagem passou">
        <strong className="titulo num">{Math.abs(dias)}</strong>
        <span>{Math.abs(dias) === 1 ? 'dia atrás' : 'dias atrás'}</span>
      </div>
    )
  }
  return (
    <div className="contagem">
      <strong className="titulo num">{dias === 0 ? 'Hoje' : dias}</strong>
      <span>{dias === 0 ? 'é o grande dia' : dias === 1 ? 'dia para o evento' : 'dias para o evento'}</span>
    </div>
  )
}

function EventoDetalhe() {
  const { id } = useParams()
  const [aba, setAba] = useState('convidados')
  const [evento, setEvento] = useState(null)

  const convidados = useConvidados(id)
  const despesas = useDespesas(id)
  const presentes = usePresentes(id)

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
      <Link to="/eventos" className="voltar"><Icone nome="voltar" tamanho={15} /> Meus eventos</Link>

      <header className="ev-topo rv">
        <span className="selo-tipo ev-topo-selo"><Icone nome={tipo.icone} tamanho={22} /></span>
        <div className="ev-topo-texto">
          <p className="eyebrow">{evento.categoria || 'Evento'}</p>
          <h1 className="titulo">{evento.nome}</h1>
          <ul className="meta-icones">
            <li><Icone nome="calendario" tamanho={15} /><span className="capitalizar">{dataLonga(evento.data_inicio)}</span></li>
            {horario && <li><Icone nome="relogio" tamanho={15} />{horario}</li>}
            {evento.local && <li><Icone nome="local" tamanho={15} />{evento.local}</li>}
          </ul>
        </div>
        <Contagem dataInicio={evento.data_inicio} />
      </header>

      <AbasEvento
        aba={aba}
        aoTrocar={setAba}
        eventoId={id}
        totalConvidados={convidados.convidados.length}
        totalDespesas={despesas.despesas.length}
        totalPresentes={presentes.presentes.length}
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

        {aba === 'presentes' && (
          <AbaPresentes
            presentes={presentes.presentes}
            carregando={presentes.carregando}
            cadastrar={presentes.cadastrar}
            reservar={presentes.reservar}
            remover={presentes.remover}
          />
        )}
      </div>
    </LayoutApp>
  )
}

export default EventoDetalhe
