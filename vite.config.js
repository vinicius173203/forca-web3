import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Configurações essenciais para deploy no Railway
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
    strictPort: true
  },
  
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    
    // Otimização para Web3
    rollupOptions: {
      external: ['@web3modal/ethers', 'web3modal'],
      output: {
        manualChunks: {
          web3: ['ethers', '@web3modal/ethers', 'web3modal']
        }
      }
    }
  }
});