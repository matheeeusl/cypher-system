import { getAbilityById, getAllAbilities } from '@cypher/content'

import { mapAbility } from './mappers.js'

export const abilityResolvers = {
  Query: {
    abilities: () => getAllAbilities().map(mapAbility),
    ability: (_parent: unknown, args: { id: string }) => {
      const found = getAbilityById(args.id)
      return found ? mapAbility(found) : null
    },
  },
}
