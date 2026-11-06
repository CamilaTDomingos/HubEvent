import Navegacao from './Navegacao'
import MenuLateral from './MenuLateral'

function LayoutApp({ children }) {
  return (
    <div className="app">
      <Navegacao />
      <MenuLateral />
      <main className="page">{children}</main>
    </div>
  )
}

export default LayoutApp
