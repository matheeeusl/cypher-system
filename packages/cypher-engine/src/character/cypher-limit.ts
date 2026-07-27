import type { Type } from '@cypher/content'

/**
 * All Types start the game able to bear two cyphers, except the Adept,
 * who can bear three — the rulebook's one exception to the universal
 * limit. Adept's exception is already fully represented by
 * special_ability_id ('expert-cypher-use' is its free tier-1 special
 * ability), so no separate per-Type field is needed for this.
 */
export function getCypherLimit(type: Pick<Type, 'special_ability_id'>): number {
  return type.special_ability_id === 'expert-cypher-use' ? 3 : 2
}
