import { getAllTypes, getTypeById } from '@cypher/content'

import { mapType } from './mappers.js'

export const typeResolvers = {
  Query: {
    types: () => getAllTypes().map(mapType),
    type: (_parent: unknown, args: { id: string }) => {
      const found = getTypeById(args.id)
      return found ? mapType(found) : null
    },
  },
}
