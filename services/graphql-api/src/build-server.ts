import cors from '@fastify/cors'
import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { createYoga, type Plugin } from 'graphql-yoga'

import { resolvers } from './resolvers/index.js'
import { buildSchema } from './schema/index.js'

const ALLOWED_ORIGINS: Array<string | RegExp> = [
  'https://csrd.app',
  'https://play.csrd.app',
  // Local dev: apps/docs and apps/app run on ports that vary across setups.
  /^http:\/\/localhost:\d+$/,
]

// Every answer this API gives is a pure function of the rules content, which
// only changes with a deploy — so GET responses (Yoga only runs queries over
// GET, never mutations) are safe to cache. s-maxage is for Vercel's CDN, whose
// cache key includes the deployment URL: a new deploy starts with an empty
// cache, so it can be long. Browsers can't tell when a deploy happens, so
// max-age stays short. POST (validateCharacterChoices, with its big input)
// is left uncached.
const GET_CACHE_CONTROL = 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800'

function useCacheableGet(): Plugin {
  return {
    onResponse({ request, response }) {
      if (request.method === 'GET' && response.status === 200) {
        response.headers.set('Cache-Control', GET_CACHE_CONTROL)
      }
    },
  }
}

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
    plugins: [useCacheableGet()],
  })

  app.route({
    url: yoga.graphqlEndpoint,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: (req, reply) => yoga.handleNodeRequestAndResponse(req, reply, { req, reply }),
  })
}
