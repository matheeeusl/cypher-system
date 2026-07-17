import { buildServer } from './server.js'

const app = buildServer()
const port = Number(process.env.PORT ?? 4000)

// host must be 0.0.0.0, not the fastify default localhost, so the server is
// reachable from outside its Docker container.
await app.listen({ port, host: '0.0.0.0' })
