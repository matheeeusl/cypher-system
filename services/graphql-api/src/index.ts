// This is the only entrypoint Vercel should detect, which is why the factory
// lives in build-server.ts: a file named server.ts (or app.ts) would be
// picked up as the entrypoint instead and fail without a default export.
import { buildServer } from './build-server.js'

const app = buildServer()
const port = Number(process.env.PORT ?? 4000)

// host must be 0.0.0.0, not the fastify default localhost, so the server is
// reachable from outside its Docker container.
await app.listen({ port, host: '0.0.0.0' })
