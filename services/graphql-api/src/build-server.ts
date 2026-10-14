import cors from '@fastify/cors'
import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { createYoga } from 'graphql-yoga'

import { resolvers } from './resolvers/index.js'
import { buildSchema } from './schema/index.js'

const ALLOWED_ORIGINS: Array<string | RegExp> = [
  'https://csrd.app',
  'https://play.csrd.app',
  // Local dev: apps/docs and apps/app run on ports that vary across setups.
  /^http:\/\/localhost:\d+$/,
]

export function buildServer(): FastifyInstance {
  const app = fastify()
  configureServer(app)
  return app
}

// Split out so index.ts can create the Fastify instance itself: Vercel only
// accepts an entrypoint that imports `fastify` directly.
export function configureServer(app: FastifyInstance): void {
  // Browsers may only call this API from these origins. CORS is a browser-side
  // rule, not authentication: requests without an Origin header (apps/app's
  // server actions, curl) are unaffected, and the API stays public by design.
  void app.register(cors, { origin: ALLOWED_ORIGINS })

  const yoga = createYoga<{ req: FastifyRequest; reply: FastifyReply }>({
    schema: buildSchema<{ req: FastifyRequest; reply: FastifyReply }>(resolvers),
  })

  app.route({
    url: yoga.graphqlEndpoint,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: (req, reply) => yoga.handleNodeRequestAndResponse(req, reply, { req, reply }),
  })
}
