import { ADVANCEMENT_COST_XP, ADVANCEMENTS_PER_TIER } from '@cypher/engine'

export const advancementResolvers = {
  Query: {
    advancementRules: () => ({
      costXp: ADVANCEMENT_COST_XP,
      perTier: ADVANCEMENTS_PER_TIER,
    }),
  },
}
