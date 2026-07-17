import { getAllFoci, getFocusById } from '@cypher/content'

import { mapFocus } from './mappers.js'

export const focusResolvers = {
  Query: {
    foci: () => getAllFoci().map(mapFocus),
    focus: (_parent: unknown, args: { id: string }) => {
      const found = getFocusById(args.id)
      return found ? mapFocus(found) : null
    },
  },
}
