
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // SEGURANÇA: Apenas variáveis com prefixo VITE_ são expostas ao cliente
  // via import.meta.env.VITE_*. Nunca usar loadEnv sem prefixo.
});
