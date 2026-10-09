import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  define: { 'import.meta.env.VITE_APP_MODE': JSON.stringify(['demo', 'operational'].includes(mode) ? mode : '') },
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': env.VITE_API_ORIGIN || 'http://127.0.0.1:4000'
    }
  },
  preview: {
    port: 3000,
    host: true
  }
  };
})
