import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const apiPort = process.env.SHIFTARC_API_PORT ?? '8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router|@tanstack)/,
              priority: 2,
            },
            {
              name: 'ui-vendor',
              test: /node_modules[\\/](motion|lucide-react|zod|react-hook-form|@hookform)/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: false,
      },
    },
  },
})
