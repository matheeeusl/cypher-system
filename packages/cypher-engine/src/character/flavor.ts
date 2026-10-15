import type { Flavor } from '@cypher/content'

import { CharacterRuleError } from '../errors.js'

export type FlavorContent = Pick<Flavor, 'id' | 'tier_abilities'>

/**
 * Pairs the character's `flavor_id` with the flavor content the caller
 * loaded. Null when the character has none (a flavor is optional). The engine
 * does no content I/O, so a chosen flavor the caller couldn't supply — or
 * supplied a different one for — is an error rather than silently ignored.
 *
 * A flavor never changes how many abilities a character picks; it only widens
 * the pool the Type picks come from (see resolveTypeAbilities).
 */
export function resolveFlavor(
  flavorId: string | null | undefined,
  flavor: FlavorContent | null | undefined,
): FlavorContent | null {
  if (flavorId === null || flavorId === undefined) return null
  if (!flavor || flavor.id !== flavorId) {
    throw new CharacterRuleError('FLAVOR_UNKNOWN', `"${flavorId}" is not a known flavor`, {
      flavorId,
    })
  }
  return flavor
}
