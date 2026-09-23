import cors from '@fastify/cors'
import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { createYoga } from 'graphql-yoga'

import { resolvers } from './resolvers/index.js'
import { buildSchema } from './schema/index.js'

export function buildServer(): FastifyInstance {
  const app = fastify()

  // Reflects the request origin rather than a fixed allowlist — this API has
  // no auth/cookies to protect yet, and dev clients (apps/app, apps/docs)
  // run on ports that change across setups. Revisit with a real allowlist
  // once this serves anything but local development.
  void app.register(cors, { origin: true })

  const yoga = createYoga<{ req: FastifyRequest; reply: FastifyReply }>({
    schema: buildSchema<{ req: FastifyRequest; reply: FastifyReply }>(resolvers),
  })

  app.route({
    url: yoga.graphqlEndpoint,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: (req, reply) => yoga.handleNodeRequestAndResponse(req, reply, { req, reply }),
  })

  return app
}
