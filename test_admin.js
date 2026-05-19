import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const url = urlMatch[1];
const key = keyMatch[1];

async function run() {
  const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'admin.geral@formandocampeoes.org.br', password: 'admin' }) // assuming password is admin or similar?
  });
  const loginData = await loginRes.json();
  if (!loginData.access_token) {
    console.log("Failed to login", loginData);
    return;
  }
  
  const token = loginData.access_token;
  const res = await fetch(`${url}/rest/v1/user_project_access?select=*,profiles(nome,email),projects!inner(slug)`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  console.log("Admin Data:", JSON.stringify(data, null, 2));
}
run();
