import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // src/lib/http-client.ts falls back to http://localhost:8000 when this is
  // unset - fine for `npm run dev`, never for a deployed bundle.
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    if (!env.VITE_API_BASE_URL) {
      throw new Error(
        'VITE_API_BASE_URL is required to build (see .env.example).',
      )
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
