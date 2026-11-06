import { supabaseAdmin } from '../services/supabaseAdmin.js'

// Rotas do app logado: o frontend manda o access_token da sessão do Supabase
// no cabeçalho Authorization. O token é validado no próprio Supabase Auth e o
// usuário fica em req.usuario.
export async function exigirLogin(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) {
    return res.status(401).json({ error: 'Entre na sua conta para usar o assistente.', codigo: 'SEM_LOGIN' })
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Sua sessão expirou. Entre de novo para continuar.', codigo: 'SEM_LOGIN' })
  }

  req.usuario = data.user
  next()
}
