import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RotaProtegida from './components/RotaProtegida'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import Eventos from './pages/Eventos'
import EventoDetalhe from './pages/EventoDetalhe'
import Rsvp from './pages/Rsvp'
import SiteEvento from './pages/SiteEvento'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/rsvp/:convidadoId" element={<Rsvp />} />
          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          />
          <Route
            path="/eventos"
            element={
              <RotaProtegida>
                <Eventos />
              </RotaProtegida>
            }
          />
          <Route
            path="/eventos/:id"
            element={
              <RotaProtegida>
                <EventoDetalhe />
              </RotaProtegida>
            }
          />
          <Route
            path="/eventos/:id/site"
            element={
              <RotaProtegida>
                <SiteEvento />
              </RotaProtegida>
            }
          />
          <Route path="/" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App