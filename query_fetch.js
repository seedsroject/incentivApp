import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const url = urlMatch[1];
const key = keyMatch[1];

async function run() {
  const res = await fetch(`${url}/rest/v1/user_project_access?select=*,profiles(nome,email),projects!inner(slug)`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
