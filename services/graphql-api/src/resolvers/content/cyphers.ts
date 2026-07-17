import { getAllCyphers, getCypherById } from '@cypher/content'

import { mapCypher } from './mappers.js'

export const cypherResolvers = {
  Query: {
    cyphers: () => getAllCyphers().map(mapCypher),
    cypher: (_parent: unknown, args: { id: string }) => {
      const found = getCypherById(args.id)
      return found ? mapCypher(found) : null
    },
  },
}
