import { deriveEdge, resolveStartingEdge } from './character/edge.js'
import { deriveEffort } from './character/effort.js'
import { resolveFocusAbilities } from './character/focus-abilities.js'
import { derivePoolMax } from './character/pool.js'
import {
  applyAbilityTrainingPurchase,
  applyDescriptorSkills,
  applySkillAdvancementPurchase,
} from './character/skills.js'
import { deriveTier } from './character/tier.js'
import { resolveTypeAbilities } from './character/type-abilities.js'
import type { KnownAbility } from './character/types.js'
import type { CharacterChoices, CharacterContent, DerivedCharacter } from './character.js'

export type ValidationResult =
  { valid: true; character: DerivedCharacter } | { valid: false; errors: string[] }

/**
 * Validates a full set of character choices, collecting every problem
 * instead of throwing on the first one — unlike the individual
 * character/* pieces this wraps, which are meant for single-step
 * interactive entry and throw immediately. Needed anywhere a caller has to
 * show every issue at once: the Review step, the server-side save gate,
 * and Rules Update Review (whose entire purpose is showing every way a
 * character's stored choices no longer match current content).
 *
 * Two of the pieces this wraps depend on another piece's output rather
 * than only on `choices`/`content` directly. When the upstream piece
 * fails, the dependent piece is skipped (with its own explanatory error)
 * instead of being run against absent or partial data, which would either
 * crash or produce a misleading secondary error:
 *   - resolveFocusAbilities needs a resolved tier (from deriveTier).
 *   - the ability-target branch of a 'skills' purchase needs the combined
 *     known_abilities list (from resolveTypeAbilities + resolveFocusAbilities).
 */
export function validateCharacterChoices(
  choices: CharacterChoices,
  content: CharacterContent,
): ValidationResult {
  const { type, descriptor, focus } = content
  const errors: string[] = []

  function attempt<T>(fn: () => T): T | undefined {
    try {
      return fn()
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
      return undefined
    }
  }

  const startingEdge = attempt(() => resolveStartingEdge(type, choices.starting_edge_choice))
  const tier = attempt(() => deriveTier(choices.advancement_purchases))
  const effort = deriveEffort(choices.advancement_purchases) // never throws
  const pools = attempt(() =>
    derivePoolMax(
      type,
      choices.pool_point_allocation,
      choices.descriptor_pool_bonus,
      choices.advancement_purchases,
    ),
  )
  const typeAbilities = attempt(() => resolveTypeAbilities(type, choices.tier_1_type_ability_ids))

  let focusAbilities: KnownAbility[] | undefined
  if (tier === undefined) {
    errors.push('Focus abilities cannot be validated: tier must be resolved first')
  } else {
    focusAbilities = attempt(() =>
      resolveFocusAbilities(focus, tier, choices.focus_choice_selections),
    )
  }

  // deriveEdge is a pure sum with no validation of its own — nothing is
  // lost by skipping it when resolveStartingEdge already failed.
  const edge =
    startingEdge === undefined ? undefined : deriveEdge(startingEdge, choices.advancement_purchases)

  let knownAbilities: KnownAbility[] | undefined
  if (typeAbilities === undefined || focusAbilities === undefined) {
    errors.push(
      'Ability-training purchases cannot be validated: known abilities must be resolved first',
    )
  } else {
    knownAbilities = [...typeAbilities, ...focusAbilities]
  }

  let skills = attempt(() => applyDescriptorSkills(descriptor, choices.descriptor_skill_choices))

  // Order-sensitive (training the same skill twice moves it further along
  // practiced -> trained -> specialized), so purchases are applied in
  // tier order regardless of how the caller supplied them.
  const skillsPurchases = choices.advancement_purchases
    .filter((purchase) => purchase.option === 'skills')
    .sort((a, b) => a.tier - b.tier)

  for (const purchase of skillsPurchases) {
    if (purchase.target.kind === 'skill') {
      // skills === undefined here means applyDescriptorSkills already
      // failed and reported its own error above — don't attempt (and
      // don't double-report).
      if (skills === undefined) continue
      const skillId = purchase.target.skill_id
      const level = attempt(() => applySkillAdvancementPurchase(skills![skillId]?.level))
      if (level !== undefined) skills = { ...skills, [skillId]: { level } }
    } else if (knownAbilities !== undefined) {
      const result = attempt(() => applyAbilityTrainingPurchase(knownAbilities!, purchase))
      if (result !== undefined) knownAbilities = result
    }
    // knownAbilities === undefined here means the blocking message above
    // already covers it — don't attempt (and don't double-report).
  }

  if (errors.length > 0) return { valid: false, errors }

  // Every piece above succeeded, so none of these are undefined — the
  // non-null assertions here are safe given errors.length === 0.
  return {
    valid: true,
    character: {
      tier: tier!,
      pools: pools!,
      edge: edge!,
      effort,
      known_abilities: knownAbilities!,
      skills: skills!,
    },
  }
}
