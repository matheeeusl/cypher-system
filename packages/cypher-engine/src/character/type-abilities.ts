import type { Type } from '@cypher/content'

import type { KnownAbility, PendingPick } from './types.js'
import { CharacterRuleError } from '../errors.js'

const REQUIRED_TIER_1_COUNT = 4

const ERRORS = {
  WRONG_COUNT: `Exactly ${REQUIRED_TIER_1_COUNT} tier-1 Type abilities must be chosen`,
  DUPLICATE: 'tier_1_type_ability_ids contains a duplicate',
  NOT_AVAILABLE: (id: string) => `"${id}" is not one of this Type's tier-1 abilities`,
}

/**
 * Resolves a character's Type-granted abilities: the 4 chosen tier-1
 * abilities (uniform "choose four" rule, confirmed across all 4 Types),
 * plus the Type's auto-granted special ability, if it has one.
 *
 * Type ability resolution beyond tier 1 is out of scope for now — the
 * per-tier counts exist in `tier_choose_counts`, but picks for later tiers
 * aren't modeled yet. See "Known gaps" in this package's CLAUDE.md.
 */
export function resolveTypeAbilities(
  type: Pick<Type, 'id' | 'tier_abilities' | 'special_ability_id'>,
  tier1AbilityIds: string[],
): KnownAbility[] {
  if (tier1AbilityIds.length !== REQUIRED_TIER_1_COUNT) {
    throw new CharacterRuleError('TYPE_ABILITY_COUNT', ERRORS.WRONG_COUNT, {
      required: REQUIRED_TIER_1_COUNT,
    })
  }
  if (new Set(tier1AbilityIds).size !== tier1AbilityIds.length) {
    throw new CharacterRuleError('TYPE_ABILITY_DUPLICATE', ERRORS.DUPLICATE)
  }

  const available = new Set(type.tier_abilities['1'] ?? [])
  for (const id of tier1AbilityIds) {
    if (!available.has(id))
      throw new CharacterRuleError('TYPE_ABILITY_UNAVAILABLE', ERRORS.NOT_AVAILABLE(id), {
        abilityId: id,
      })
  }

  const source = { kind: 'type', type_id: type.id } as const

  const abilities: KnownAbility[] = tier1AbilityIds.map((ability_id) => ({
    ability_id,
    source,
    trained: false,
  }))

  if (type.special_ability_id !== null) {
    abilities.push({ ability_id: type.special_ability_id, source, trained: false })
  }

  return abilities
}

const PICK_ERRORS = {
  TOO_MANY: (tier: number, required: number) =>
    `Tier ${tier} lets this Type pick ${required} ability(ies), but more were supplied`,
  UNAVAILABLE: (id: string, tier: number) =>
    `"${id}" is not one of this Type's abilities at or below tier ${tier}`,
  DUPLICATE: (id: string) => `"${id}" is picked more than once across the Type abilities`,
  FUTURE_TIER: (tier: number) =>
    `Type ability picks were supplied for tier ${tier}, not reached yet`,
}

/**
 * Resolves the Type abilities picked from tier 2 up. Each tier's pick count
 * is the Type's `tier_choose_counts`; a pick may come from that tier or any
 * lower one, and no ability can be known twice (counting the tier-1 picks in
 * `alreadyKnown`). Fewer picks than required is not an error — those are
 * reported in `pending`, the player's outstanding choices after a tier-up.
 */
export function resolveTypeTierPicks(
  type: Pick<Type, 'id' | 'tier_abilities' | 'tier_choose_counts'>,
  currentTier: number,
  picks: Record<string, string[]>,
  alreadyKnown: string[],
  pending: PendingPick[],
): KnownAbility[] {
  for (const tierKey of Object.keys(picks)) {
    if (Number(tierKey) > currentTier || Number(tierKey) < 2) {
      throw new CharacterRuleError(
        'TYPE_PICKS_FUTURE_TIER',
        PICK_ERRORS.FUTURE_TIER(Number(tierKey)),
        {
          tier: Number(tierKey),
        },
      )
    }
  }

  const source = { kind: 'type', type_id: type.id } as const
  const known = new Set(alreadyKnown)
  const abilities: KnownAbility[] = []
  const available = new Set<string>(type.tier_abilities['1'] ?? [])

  for (let tier = 2; tier <= currentTier; tier++) {
    for (const id of type.tier_abilities[String(tier)] ?? []) available.add(id)
    const required = type.tier_choose_counts[String(tier)] ?? 0
    const chosen = picks[String(tier)] ?? []

    if (chosen.length > required) {
      throw new CharacterRuleError('TYPE_PICKS_TOO_MANY', PICK_ERRORS.TOO_MANY(tier, required), {
        tier,
        required,
      })
    }
    for (const id of chosen) {
      if (!available.has(id)) {
        throw new CharacterRuleError('TYPE_PICKS_UNAVAILABLE', PICK_ERRORS.UNAVAILABLE(id, tier), {
          tier,
          abilityId: id,
        })
      }
      if (known.has(id)) {
        throw new CharacterRuleError('TYPE_PICKS_DUPLICATE', PICK_ERRORS.DUPLICATE(id), {
          abilityId: id,
        })
      }
      known.add(id)
      abilities.push({ ability_id: id, source, trained: false })
    }
    if (chosen.length < required) {
      pending.push({ kind: 'type', tier, required, chosen: chosen.length })
    }
  }

  return abilities
}

/** Pending picks in the order a player would make them: by tier, Type before Focus. */
export function sortPending(pending: PendingPick[]): PendingPick[] {
  return [...pending].sort(
    (a, b) => a.tier - b.tier || (a.kind === b.kind ? 0 : a.kind === 'type' ? -1 : 1),
  )
}
