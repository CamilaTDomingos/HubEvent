import Navegacao from './Navegacao'

function LayoutApp({ children }) {
  return (
    <div className="app">
      <Navegacao />
      <main className="page">{children}</main>
    </div>
  )
}

export default LayoutApp
