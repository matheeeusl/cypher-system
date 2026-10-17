import {
  ADVANCEMENT_COST_XP,
  ADVANCEMENTS_PER_TIER,
  ARMOR_SPEED_COST_REDUCTION,
  FLAVOR_GAIN_COST_XP,
  MAX_TIER,
  RECOVERY_ROLL_BONUS,
} from '@cypher/engine'

export const advancementResolvers = {
  Query: {
    advancementRules: () => ({
      costXp: ADVANCEMENT_COST_XP,
      perTier: ADVANCEMENTS_PER_TIER,
      maxTier: MAX_TIER,
      flavorCostXp: FLAVOR_GAIN_COST_XP,
      recoveryRollBonus: RECOVERY_ROLL_BONUS,
      armorSpeedCostReduction: ARMOR_SPEED_COST_REDUCTION,
    }),
  },
}
