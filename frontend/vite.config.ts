import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/resume': 'http://localhost:8080',
      '/vacancy': 'http://localhost:8080',
      '/vacancies': 'http://localhost:8080',
      '/email': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
      '/candidate': 'http://localhost:8080',
      '/employer': 'http://localhost:8080',
      '/conversations': 'http://localhost:8080',
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    }
  }
})
