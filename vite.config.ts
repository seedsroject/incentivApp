
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // SEGURANÇA: Apenas variáveis com prefixo VITE_ são expostas ao cliente.
  // Nunca injetar chaves de serviço (SERVICE_ROLE_KEY) no bundle.
  // A GEMINI_API_KEY usa VITE_GEMINI_API_KEY para ser explícita sobre exposição.
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || ''),
  },
});
