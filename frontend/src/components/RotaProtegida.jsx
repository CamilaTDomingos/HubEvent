import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Carregando from './Carregando'

function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <Carregando telaCheia />
  if (!usuario) return <Navigate to="/login" replace />

  return children
}

export default RotaProtegida
