import type { Focus } from '@cypher/content'

import type { KnownAbility } from './types.js'

const ERRORS = {
  MISSING_SELECTION: (tier: string) =>
    `Focus tier ${tier} offers a choice, but no selection was supplied for it`,
  INVALID_SELECTION: (tier: string) =>
    `The focus_choice_selections entry for tier ${tier} is not one of that tier's two options`,
}

/**
 * Resolves a character's Focus-granted abilities across every tier up to
 * (and including) their current tier. Most tier entries are automatic
 * grants; occasional tiers offer a binary choice between exactly two
 * abilities, resolved from focus_choice_selections.
 */
export function resolveFocusAbilities(
  focus: Pick<Focus, 'id' | 'tier_abilities'>,
  currentTier: number,
  choiceSelections: Record<string, string>,
): KnownAbility[] {
  const source = { kind: 'focus', focus_id: focus.id } as const
  const abilities: KnownAbility[] = []

  for (const [tierKey, entries] of Object.entries(focus.tier_abilities)) {
    if (Number(tierKey) > currentTier) continue

    for (const entry of entries) {
      if (entry.kind === 'granted') {
        abilities.push({ ability_id: entry.ability_id, source, trained: false })
        continue
      }

      const selection = choiceSelections[tierKey]
      if (selection === undefined) throw new Error(ERRORS.MISSING_SELECTION(tierKey))
      if (!entry.options.includes(selection)) throw new Error(ERRORS.INVALID_SELECTION(tierKey))

      abilities.push({ ability_id: selection, source, trained: false })
    }
  }

  return abilities
}
