// Vercel's Fastify detection needs the entrypoint to import `fastify` itself,
// and a file named server.ts or app.ts would be picked up instead (and fail
// without a default export) — so the instance is created here and configured
// by build-server.ts, which the tests use through buildServer().
import fastify from 'fastify'

import { configureServer } from './build-server.js'

const app = fastify()
configureServer(app)
const port = Number(process.env.PORT ?? 4000)

// host must be 0.0.0.0, not the fastify default localhost, so the server is
// reachable from outside its Docker container.
//
// Not awaited on purpose: Vercel intercepts listen() to capture the server and
// route requests to it, and an awaited call there can leave module loading
// pending forever (every request hangs). A failed listen still exits non-zero.
app.listen({ port, host: '0.0.0.0' }).catch((error: unknown) => {
  app.log.error(error)
  process.exit(1)
})
