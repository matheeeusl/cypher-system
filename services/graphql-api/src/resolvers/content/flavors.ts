import { getAllFlavors, getFlavorById } from '@cypher/content'

import { mapFlavor } from './mappers.js'

export const flavorResolvers = {
  Query: {
    flavors: () => getAllFlavors().map(mapFlavor),
    flavor: (_parent: unknown, args: { id: string }) => {
      const found = getFlavorById(args.id)
      return found ? mapFlavor(found) : null
    },
  },
}
