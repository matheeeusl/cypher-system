import {
  ADVANCEMENT_COST_XP,
  ADVANCEMENTS_PER_TIER,
  FLAVOR_GAIN_COST_XP,
  MAX_TIER,
} from '@cypher/engine'

export const advancementResolvers = {
  Query: {
    advancementRules: () => ({
      costXp: ADVANCEMENT_COST_XP,
      perTier: ADVANCEMENTS_PER_TIER,
      maxTier: MAX_TIER,
      flavorCostXp: FLAVOR_GAIN_COST_XP,
    }),
  },
}
