import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://example.com' // Needs to be loaded from .env
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'key'

// Since we are running in node, we need to load .env
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase
    .from('user_project_access')
    .select('*, profiles(nome, email), projects!inner(slug), nucleos(estado)')
    .eq('status', 'PENDENTE')
  console.log(JSON.stringify({data, error}, null, 2))
}

run()
