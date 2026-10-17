import type { Focus, Type } from '@cypher/content'

import { ARMOR_SPEED_COST_REDUCTION, RECOVERY_ROLL_BONUS } from '../advancement.js'
import { CharacterRuleError } from '../errors.js'
import type { FlavorContent } from './flavor.js'
import type { AdvancementPurchase, KnownAbility } from './types.js'

const ERRORS = {
  NOT_OFFERED: (id: string, tier: number) =>
    `"${id}" is not one of this Type's (or flavor's) abilities at or below tier ${tier}`,
  KNOWN: (id: string) => `"${id}" is taken by an advancement, but the character already has it`,
  FOCUS_OPTION_INVALID: (ids: string[], tier: number) =>
    `"${ids.join('", "')}" is not an unchosen option of a Focus choice at or below tier ${tier}`,
  FOCUS_FIRST_CHOICE_MISSING: (tier: string) =>
    `A second Focus choice for tier ${tier} needs that tier's first choice made`,
}

/** Added to recovery rolls by the 'recovery-roll-bonus' purchases. */
export function deriveRecoveryRollBonus(purchases: AdvancementPurchase[]): number {
  return RECOVERY_ROLL_BONUS * purchases.filter((p) => p.option === 'recovery-roll-bonus').length
}

/** Taken off the Speed Effort cost of armor by the 'reduce-armor-speed-cost' purchases. */
export function deriveArmorSpeedCostReduction(purchases: AdvancementPurchase[]): number {
  return (
    ARMOR_SPEED_COST_REDUCTION *
    purchases.filter((p) => p.option === 'reduce-armor-speed-cost').length
  )
}

type AbilityPurchase = Extract<AdvancementPurchase, { option: 'type-ability' | 'focus-ability' }>

/** The 'type-ability' and 'focus-ability' purchases, in tier order. */
export function abilityPurchases(purchases: AdvancementPurchase[]): AbilityPurchase[] {
  return purchases
    .filter(
      (p): p is AbilityPurchase => p.option === 'type-ability' || p.option === 'focus-ability',
    )
    .sort((a, b) => a.tier - b.tier)
}

/** The ability ids an ability purchase gives. */
export function purchasedAbilityIds(purchase: AbilityPurchase): string[] {
  return purchase.option === 'type-ability' ? [purchase.ability_id] : purchase.ability_ids
}

/**
 * Resolves the abilities gained through the Other Options. A purchase tagged
 * tier N is bought at tier N−1, so that is the highest tier it can take from:
 *
 * - 'type-ability': an ability the Type or the flavor offers at that tier or
 *   lower, not already known (unless it's `repeatable`);
 * - 'focus-ability': one more option of a Focus choice at that tier or lower,
 *   whose first choice is already made (bundled pairs give both ids).
 *
 * They are `KnownAbility`s with source `{ kind: 'advancement', tier }`. Call
 * it with every other ability already resolved in `known`.
 */
export function resolveAdvancementAbilities(
  type: Pick<Type, 'tier_abilities'>,
  flavor: FlavorContent | null | undefined,
  focus: Pick<Focus, 'tier_abilities'>,
  purchases: AdvancementPurchase[],
  focusSelections: Record<string, string[]>,
  known: KnownAbility[],
  repeatable: ReadonlySet<string> = new Set(),
): KnownAbility[] {
  const knownIds = new Set(known.map((a) => a.ability_id))
  const abilities: KnownAbility[] = []

  for (const purchase of abilityPurchases(purchases)) {
    const maxTier = purchase.tier - 1
    const source = { kind: 'advancement', tier: purchase.tier } as const

    if (purchase.option === 'type-ability') {
      const id = purchase.ability_id
      const offered = [type.tier_abilities, flavor?.tier_abilities ?? {}].some((byTier) =>
        Object.entries(byTier).some(([t, ids]) => Number(t) <= maxTier && ids.includes(id)),
      )
      if (!offered) {
        throw new CharacterRuleError(
          'ADVANCEMENT_ABILITY_NOT_OFFERED',
          ERRORS.NOT_OFFERED(id, maxTier),
          { abilityId: id, tier: maxTier },
        )
      }
      if (knownIds.has(id) && !repeatable.has(id)) {
        throw new CharacterRuleError('ADVANCEMENT_ABILITY_KNOWN', ERRORS.KNOWN(id), {
          abilityId: id,
        })
      }
      knownIds.add(id)
      abilities.push({ ability_id: id, source, trained: false })
      continue
    }

    const wanted = new Set(purchase.ability_ids)
    const invalid = () =>
      new CharacterRuleError(
        'ADVANCEMENT_FOCUS_OPTION_INVALID',
        ERRORS.FOCUS_OPTION_INVALID(purchase.ability_ids, maxTier),
        { abilityIds: purchase.ability_ids.join(', '), tier: maxTier },
      )
    // The Focus tier whose choice offers exactly these ids as one option.
    const match = Object.entries(focus.tier_abilities).find(
      ([t, entries]) =>
        Number(t) <= maxTier &&
        entries.some(
          (entry) =>
            entry.kind === 'choice' &&
            entry.options.some((option) => {
              const ids = typeof option === 'string' ? [option] : option
              return ids.length === wanted.size && ids.every((i) => wanted.has(i))
            }),
        ),
    )
    if (wanted.size !== purchase.ability_ids.length || !match) throw invalid()

    const [tierKey] = match
    const firstChoice = focusSelections[tierKey] ?? []
    if (firstChoice.length === 0) {
      throw new CharacterRuleError(
        'ADVANCEMENT_FOCUS_FIRST_CHOICE_MISSING',
        ERRORS.FOCUS_FIRST_CHOICE_MISSING(tierKey),
        { tier: tierKey },
      )
    }
    if (purchase.ability_ids.some((id) => firstChoice.includes(id))) throw invalid()
    for (const id of purchase.ability_ids) {
      if (knownIds.has(id)) {
        throw new CharacterRuleError('ADVANCEMENT_ABILITY_KNOWN', ERRORS.KNOWN(id), {
          abilityId: id,
        })
      }
      knownIds.add(id)
      abilities.push({ ability_id: id, source, trained: false })
    }
  }

  return abilities
}
