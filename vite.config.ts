
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // SEGURANÇA: Apenas variáveis com prefixo VITE_ são expostas ao cliente
  // via import.meta.env.VITE_*. Nunca usar loadEnv sem prefixo.
  build: {
    // Separa bibliotecas pesadas em chunks independentes
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-pdf': ['jspdf', 'pdf-lib'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-genai': ['@google/genai'],
          'vendor-ui': ['lucide-react'],
        },
      },
    },
    // Aumenta o limite de aviso para 1400kB (App.tsx é ~1350kB compilado)
    // TODO: Dividir App.tsx em rotas com React.lazy() para reduzir de verdade
    chunkSizeWarningLimit: 1400,
  },
});
