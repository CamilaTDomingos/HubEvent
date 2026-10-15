import LayoutApp from '../components/LayoutApp'
import GerenciarCategorias from '../components/GerenciarCategorias'
import './Perfil.css'

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
    </LayoutApp>
  )
}

export default Perfil
