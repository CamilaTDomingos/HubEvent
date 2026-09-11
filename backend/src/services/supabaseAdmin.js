import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)   


/* import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
console.log('--- TESTE DAS VARIÁVEIS ---')
console.log('URL:', process.env.SUPABASE_URL)
console.log('KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK (preenchida)' : 'VAZIA')
console.log('---------------------------')
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
) */