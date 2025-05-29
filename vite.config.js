import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Remova completamente a seção rollupOptions
    sourcemap: true // Mantenha se precisar de debug
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})