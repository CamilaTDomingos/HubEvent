import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

function Dashboard() {
  const { usuario } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Logado como: {usuario?.email}</p>
      <button onClick={handleLogout}>Sair</button>
    </div>
  )
}

export default Dashboard