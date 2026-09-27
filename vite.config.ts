import { createHash } from 'node:crypto'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Production Content-Security-Policy, injected as a <meta> tag at build
 * time so the API origin comes from VITE_API_BASE_URL - one source of
 * truth, nothing hard-coded per environment. The inline theme script in
 * index.html is allowed by its sha256, computed here from the final HTML,
 * so editing that script can never silently break the page.
 *
 * frame-ancestors can't be set from a <meta> tag: it's sent as an HTTP
 * header by vercel.json, alongside the other security headers.
 */
function contentSecurityPolicy(apiBaseUrl: string): Plugin {
  const apiOrigin = new URL(apiBaseUrl).origin
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const inlineScriptHashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
          ([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
        )
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${inlineScriptHashes.join(' ')}`,
          // 'unsafe-inline' for styles only: sonner injects a <style> tag at
          // runtime. Scripts stay locked down, which is what matters for XSS.
          "style-src 'self' 'unsafe-inline'",
          // API calls, and logos/avatars served from the API's /storage.
          `connect-src 'self' ${apiOrigin}`,
          `img-src 'self' data: blob: ${apiOrigin}`,
          "font-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        )
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // src/lib/http-client.ts falls back to http://localhost:8000 when this is
  // unset - fine for `npm run dev`, never for a deployed bundle.
  if (command === 'build' && !env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required to build (see .env.example).')
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(command === 'build' ? [contentSecurityPolicy(env.VITE_API_BASE_URL)] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
