import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IResolvers } from '@graphql-tools/utils'
import { createSchema, type YogaInitialContext } from 'graphql-yoga'

// schema.graphql lives at the package root (a sibling of both src/ and dist/),
// the same layout @cypher/content uses for its content/ YAML directory, so
// this path resolves whether running from source or from the built dist/.
const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../schema.graphql')

// Generic over the extra per-request context (e.g. Fastify's {req, reply}),
// mirroring createSchema's own <TContext> parameter — YogaInitialContext is
// ANDed in automatically by createSchema itself.
export function buildSchema<TContext = object>(
  resolvers: IResolvers<unknown, TContext & YogaInitialContext> = {},
) {
  const typeDefs = readFileSync(SCHEMA_PATH, 'utf-8')
  return createSchema<TContext>({ typeDefs, resolvers })
}
