import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  envDir: '.', // Especifica que o .env tá na raiz
  envPrefix: 'VITE_', // Garante que só variáveis com VITE_ sejam carregadas
});