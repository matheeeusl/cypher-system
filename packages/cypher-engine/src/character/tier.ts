import {
  ADVANCEMENTS_PER_TIER,
  MAX_TIER,
  OTHER_ADVANCEMENTS,
  STANDARD_ADVANCEMENTS,
} from '../advancement.js'
import type { AdvancementPurchase } from './types.js'
import { CharacterRuleError } from '../errors.js'

const isStandard = (option: string) => STANDARD_ADVANCEMENTS.some((a) => a.id === option)
const isOther = (option: string) => OTHER_ADVANCEMENTS.some((a) => a.id === option)

const ERRORS = {
  UNKNOWN_OPTION: (option: string) => `Advancement option "${option}" is not a known advancement`,
  OTHER_REPEATED: (tier: number) =>
    `Tier ${tier} purchases include more than one Other option — only one is allowed per tier`,
  DUPLICATE_OPTION: (tier: number) =>
    `Tier ${tier} purchases repeat the same advancement option more than once`,
  INCOMPLETE_TIER: (tier: number) =>
    `Tier ${tier} has ${ADVANCEMENTS_PER_TIER} advancements to purchase, but a different number were supplied`,
  TOO_HIGH: (tier: number) => `Tier ${tier} is above the maximum tier ${MAX_TIER}`,
  GAP: (tier: number) =>
    `Tier ${tier} has no purchases, but a later tier does — tiers must complete in order`,
}

/**
 * Current tier, derived from advancement purchase history. A purchase's
 * `tier` is the tier it advances the character *toward* (the four purchases
 * tagged `tier: 2` take a tier-1 character to tier 2). A tier is "complete"
 * once 4 advancements have been purchased for it: each standard one at most
 * once, and at most one Other option in place of a standard one. Tiers must
 * complete in order, starting at 2. The newest tier may be incomplete (the
 * character is partway there and keeps the current tier).
 */
export function deriveTier(purchases: AdvancementPurchase[]): number {
  for (const purchase of purchases) {
    if (!isStandard(purchase.option) && !isOther(purchase.option)) {
      throw new CharacterRuleError('TIER_OPTION_UNKNOWN', ERRORS.UNKNOWN_OPTION(purchase.option), {
        option: purchase.option,
      })
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
  if (highestTierWithPurchases > MAX_TIER)
    throw new CharacterRuleError('TIER_TOO_HIGH', ERRORS.TOO_HIGH(highestTierWithPurchases), {
      tier: highestTierWithPurchases,
    })

  let tier = 1
  for (let candidateTier = 2; candidateTier <= highestTierWithPurchases; candidateTier++) {
    const tierPurchases = purchasesByTier.get(candidateTier)
    if (!tierPurchases)
      throw new CharacterRuleError('TIER_GAP', ERRORS.GAP(candidateTier), { tier: candidateTier })

    const optionIds = tierPurchases.map((purchase) => purchase.option)
    if (optionIds.filter(isOther).length > 1) {
      throw new CharacterRuleError('TIER_OTHER_REPEATED', ERRORS.OTHER_REPEATED(candidateTier), {
        tier: candidateTier,
      })
    }
    const standardIds = optionIds.filter(isStandard)
    if (new Set(standardIds).size !== standardIds.length) {
      throw new CharacterRuleError(
        'TIER_DUPLICATE_OPTION',
        ERRORS.DUPLICATE_OPTION(candidateTier),
        {
          tier: candidateTier,
        },
      )
    }
    // With no repeated standard option and at most one Other, a count of 4
    // means either all 4 standard ones or 3 of them plus an Other. The newest tier may be only partly bought — advancements are
    // purchased one at a time, in any order, and the character advances only
    // when the fourth lands — so it just doesn't count yet. An older tier with
    // fewer than 4 is a real error: a later tier can't start before it finishes.
    if (optionIds.length < ADVANCEMENTS_PER_TIER && candidateTier === highestTierWithPurchases) {
      break
    }
    if (optionIds.length !== ADVANCEMENTS_PER_TIER) {
      throw new CharacterRuleError('TIER_INCOMPLETE', ERRORS.INCOMPLETE_TIER(candidateTier), {
        tier: candidateTier,
      })
    }

    tier = candidateTier
  }

  return tier
}
