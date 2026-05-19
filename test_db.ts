import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase
    .from('user_project_access')
    .select('*')
    .eq('status', 'PENDENTE')
  console.log('Without join:', JSON.stringify({data, error}, null, 2))

  const { data: d2, error: e2 } = await supabase
    .from('user_project_access')
    .select('*, profiles(nome, email), projects!inner(slug)')
    .eq('status', 'PENDENTE')
  console.log('With join:', JSON.stringify({data: d2, error: e2}, null, 2))
}

run()
