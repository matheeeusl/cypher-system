import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { createYoga } from 'graphql-yoga'

import { resolvers } from './resolvers/index.js'
import { buildSchema } from './schema/index.js'

export function buildServer(): FastifyInstance {
  const app = fastify()

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
