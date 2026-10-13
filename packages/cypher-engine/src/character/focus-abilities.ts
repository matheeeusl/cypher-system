import type { Focus } from '@cypher/content'

import type { KnownAbility, PendingPick } from './types.js'
import { CharacterRuleError } from '../errors.js'

const ERRORS = {
  MISSING_SELECTION: (tier: string) =>
    `Focus tier ${tier} offers a choice, but no selection was supplied for it`,
  INVALID_SELECTION: (tier: string) =>
    `The focus_choice_selections entry for tier ${tier} is not a valid set of that tier's options`,
}

/**
 * Resolves a character's Focus-granted abilities across every tier up to
 * (and including) their current tier. Most tier entries are automatic
 * grants; occasional tiers offer a choice of `count` options (a bundled pair
 * counts as one option), resolved from focus_choice_selections.
 *
 * A missing selection is an error for tier 1 (the creation step). For a
 * higher tier it is a _pending pick_ — the player just levelled up and hasn't
 * chosen yet — reported through `pending` when the caller passes one in, and
 * an error when not.
 */
export function resolveFocusAbilities(
  focus: Pick<Focus, 'id' | 'tier_abilities'>,
  currentTier: number,
  choiceSelections: Record<string, string[]>,
  pending?: PendingPick[],
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
      if (selection === undefined || selection.length === 0) {
        if (pending && Number(tierKey) > 1) {
          pending.push({ kind: 'focus', tier: Number(tierKey), required: entry.count, chosen: 0 })
          continue
        }
        throw new CharacterRuleError('FOCUS_SELECTION_MISSING', ERRORS.MISSING_SELECTION(tierKey), {
          tier: tierKey,
        })
      }

      const picked = new Set(selection)
      const chosenOptions = entry.options.filter((option) =>
        (typeof option === 'string' ? [option] : option).every((id) => picked.has(id)),
      )
      const coveredIds = chosenOptions.flatMap((option) =>
        typeof option === 'string' ? [option] : option,
      )
      if (
        picked.size !== selection.length ||
        chosenOptions.length !== entry.count ||
        coveredIds.length !== selection.length
      ) {
        throw new CharacterRuleError('FOCUS_SELECTION_INVALID', ERRORS.INVALID_SELECTION(tierKey), {
          tier: tierKey,
        })
      }

      for (const ability_id of coveredIds) {
        abilities.push({ ability_id, source, trained: false })
      }
    }
  }

  return abilities
}
