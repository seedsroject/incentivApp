/**
 * Supabase Client — Ponto central de conexão com o banco.
 * Usa variáveis de ambiente Vite (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ SUPABASE: Variáveis de ambiente VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não encontradas.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
