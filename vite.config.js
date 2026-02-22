import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const serpApiProxy = {
  target: 'https://serpapi.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/serpapi/, ''),
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/serpapi': serpApiProxy,
    },
  },
  preview: {
    proxy: {
      '/api/serpapi': serpApiProxy,
    },
  },
})
