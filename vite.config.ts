import { createHash } from 'node:crypto'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Production Content-Security-Policy, injected as a <meta> tag at build
 * time. The API is same-origin behind the /backend proxy (NGINX in prod),
 * so 'self' covers it - no backend origin to hard-code. The inline theme
 * script in index.html is allowed by its sha256, computed here from the
 * final HTML, so editing that script can never silently break the page.
 *
 * frame-ancestors can't be set from a <meta> tag: it's sent as an HTTP
 * header by NGINX, alongside the other security headers (docs/deployment.md).
 */
function contentSecurityPolicy(): Plugin {
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
          // API calls go through the same-origin /backend proxy. Logos and
          // avatars may still come back as absolute https URLs built from
          // the backend's APP_URL - safeImageUrl() already filters those.
          "connect-src 'self'",
          "img-src 'self' data: blob: https:",
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
export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(command === 'build' ? [contentSecurityPolicy()] : []),
    ],
    // Mirrors the /backend proxy NGINX does in prod so the front code is the
    // same in dev and prod.
    server: {
      proxy: {
        '/backend': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
