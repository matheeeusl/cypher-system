import type { Type } from '@cypher/content'

import type { KnownAbility } from './types'

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
 * "choose N" count varies by both tier and Type and isn't captured in
 * TypeSchema yet. See "Known gaps" in this package's CLAUDE.md.
 */
export function resolveTypeAbilities(
  type: Pick<Type, 'id' | 'tier_abilities' | 'special_ability_id'>,
  tier1AbilityIds: string[],
): KnownAbility[] {
  if (tier1AbilityIds.length !== REQUIRED_TIER_1_COUNT) {
    throw new Error(ERRORS.WRONG_COUNT)
  }
  if (new Set(tier1AbilityIds).size !== tier1AbilityIds.length) {
    throw new Error(ERRORS.DUPLICATE)
  }

  const available = new Set(type.tier_abilities['1'] ?? [])
  for (const id of tier1AbilityIds) {
    if (!available.has(id)) throw new Error(ERRORS.NOT_AVAILABLE(id))
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
