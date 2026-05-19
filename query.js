import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase
    .from('user_project_access')
    .select('id, user_id, status, role, estado_responsavel, project_id, nucleo_id')
    .eq('status', 'PENDENTE')
  console.log(data, error)
}
run()
