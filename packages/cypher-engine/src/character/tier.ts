import { ADVANCEMENTS_PER_TIER, STANDARD_ADVANCEMENTS } from '../advancement.js'
import type { AdvancementPurchase } from './types.js'
import { CharacterRuleError } from '../errors.js'

const ERRORS = {
  SUBSTITUTION_NOT_SUPPORTED: (option: string) =>
    // TODO: the rulebook's "OTHER OPTIONS" substitutions (Reduce Speed
    // Effort cost for armor, +2 recovery rolls, an extra Type ability from
    // a lower tier) aren't modeled yet. Reject rather than silently
    // mis-validate — see "Known gaps" in this package's CLAUDE.md.
    `Advancement option "${option}" is not one of the 4 standard advancements, and substitution options are not yet supported`,
  DUPLICATE_OPTION: (tier: number) =>
    `Tier ${tier} purchases repeat the same advancement option more than once`,
  INCOMPLETE_TIER: (tier: number) =>
    `Tier ${tier} has ${ADVANCEMENTS_PER_TIER} standard advancements to purchase, but a different number were supplied`,
  GAP: (tier: number) =>
    `Tier ${tier} has no purchases, but a later tier does — tiers must complete in order`,
}

/**
 * Current tier, derived from advancement purchase history. A tier is
 * "complete" only once all 4 standard advancements have been purchased for
 * it (each exactly once); tiers must complete in order, starting at 2.
 */
export function deriveTier(purchases: AdvancementPurchase[]): number {
  for (const purchase of purchases) {
    if (!STANDARD_ADVANCEMENTS.some((advancement) => advancement.id === purchase.option)) {
      throw new CharacterRuleError(
        'TIER_SUBSTITUTION_UNSUPPORTED',
        ERRORS.SUBSTITUTION_NOT_SUPPORTED(purchase.option),
        { option: purchase.option },
      )
    }
  }

  const purchasesByTier = new Map<number, AdvancementPurchase[]>()
  for (const purchase of purchases) {
    const tierPurchases = purchasesByTier.get(purchase.tier) ?? []
    tierPurchases.push(purchase)
    purchasesByTier.set(purchase.tier, tierPurchases)
  }

  if (purchasesByTier.size === 0) return 1

  const highestTierWithPurchases = Math.max(...purchasesByTier.keys())

  let tier = 1
  for (let candidateTier = 2; candidateTier <= highestTierWithPurchases; candidateTier++) {
    const tierPurchases = purchasesByTier.get(candidateTier)
    if (!tierPurchases)
      throw new CharacterRuleError('TIER_GAP', ERRORS.GAP(candidateTier), { tier: candidateTier })

    const optionIds = tierPurchases.map((purchase) => purchase.option)
    if (new Set(optionIds).size !== optionIds.length) {
      throw new CharacterRuleError(
        'TIER_DUPLICATE_OPTION',
        ERRORS.DUPLICATE_OPTION(candidateTier),
        {
          tier: candidateTier,
        },
      )
    }
    // No duplicates + this many entries, drawn from exactly 4 possible
    // standard option ids, means all 4 are present only when the count
    // matches — otherwise the tier is incomplete.
    if (optionIds.length !== ADVANCEMENTS_PER_TIER) {
      throw new CharacterRuleError('TIER_INCOMPLETE', ERRORS.INCOMPLETE_TIER(candidateTier), {
        tier: candidateTier,
      })
    }

    tier = candidateTier
  }

  return tier
}
