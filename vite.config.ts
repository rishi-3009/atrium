import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

/**
 * Serves /api/tutor and /api/identify in `npm run dev`, so the tutor works without the Vercel
 * CLI. It runs the same function that Vercel runs in production. Dev only.
 */
function devApi(): Plugin {
  return {
    name: 'atrium-dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      if (env.LLM_API_KEY) process.env.LLM_API_KEY = env.LLM_API_KEY

      for (const name of ['tutor', 'identify'])
        server.middlewares.use(`/api/${name}`, (req, res) => {
          void (async () => {
            try {
              if (req.method !== 'POST') {
                res.statusCode = 405
                res.end()
                return
              }
              const chunks: Buffer[] = []
              for await (const c of req) chunks.push(c as Buffer)
              const abort = new AbortController()
              res.on('close', () => abort.abort())
              const request = new Request(`http://localhost/api/${name}`, {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-forwarded-for': req.socket.remoteAddress ?? '',
                },
                body: Buffer.concat(chunks),
                signal: abort.signal,
              })
              const mod = (await server.ssrLoadModule(`/api/${name}.ts`)) as {
                POST: (r: Request) => Promise<Response>
              }
              const reply = await mod.POST(request)
              res.statusCode = reply.status
              reply.headers.forEach((v, k) => res.setHeader(k, v))
              if (!reply.body) return void res.end()
              const reader = reply.body.getReader()
              for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                res.write(value)
              }
              res.end()
            } catch (err) {
              console.error('dev api failed', err instanceof Error ? err.message : err)
              if (!res.headersSent) res.statusCode = 500
              res.end()
            }
          })()
        })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
