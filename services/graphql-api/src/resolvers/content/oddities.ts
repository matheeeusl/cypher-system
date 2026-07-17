import { getAllOddities, getOddityById } from '@cypher/content'

import { mapOddity } from './mappers.js'

export const oddityResolvers = {
  Query: {
    oddities: () => getAllOddities().map(mapOddity),
    oddity: (_parent: unknown, args: { id: string }) => {
      const found = getOddityById(args.id)
      return found ? mapOddity(found) : null
    },
  },
}
