import type { Descriptor, Focus, Type } from '@cypher/content'

import { deriveEdge, resolveStartingEdge } from './character/edge'
import { deriveEffort } from './character/effort'
import { resolveFocusAbilities } from './character/focus-abilities'
import { derivePoolMax } from './character/pool'
import {
  applyAbilityTrainingPurchase,
  applyDescriptorSkills,
  applySkillAdvancementPurchase,
} from './character/skills'
import { deriveTier } from './character/tier'
import { resolveTypeAbilities } from './character/type-abilities'
import type {
  CharacterChoices,
  DerivedCharacter,
  KnownAbility,
  SkillLevel,
} from './character/types'

export * from './character/types'

export interface CharacterContent {
  type: Type
  descriptor: Descriptor
  focus: Focus
}

/**
 * Derives a character's full stat block from their choices. Pure and
 * deterministic — the caller is responsible for fetching `content` via
 * @cypher/content's loader; this function does no I/O. Meant to be called
 * both for live numbers during character creation and to recompute/validate
 * on the server whenever a character is saved — never trust a
 * client-submitted derived block.
 */
export function deriveCharacter(
  choices: CharacterChoices,
  content: CharacterContent,
): DerivedCharacter {
  const { type, descriptor, focus } = content

  const startingEdge = resolveStartingEdge(type, choices.starting_edge_choice)
  const tier = deriveTier(choices.advancement_purchases)
  const edge = deriveEdge(startingEdge, choices.advancement_purchases)
  const effort = deriveEffort(choices.advancement_purchases)
  const pools = derivePoolMax(
    type,
    choices.pool_point_allocation,
    choices.descriptor_pool_bonus,
    choices.advancement_purchases,
  )

  let knownAbilities: KnownAbility[] = [
    ...resolveTypeAbilities(type, choices.tier_1_type_ability_ids),
    ...resolveFocusAbilities(focus, tier, choices.focus_choice_selections),
  ]

  let skills = applyDescriptorSkills(descriptor)

  // 'skills' purchases are order-sensitive (training the same skill twice
  // moves it further along practiced -> trained -> specialized), so they're
  // applied in tier order regardless of how the caller supplied them.
  const skillsPurchases = choices.advancement_purchases
    .filter((purchase) => purchase.option === 'skills')
    .sort((a, b) => a.tier - b.tier)

  for (const purchase of skillsPurchases) {
    if (purchase.target.kind === 'skill') {
      const skillId = purchase.target.skill_id
      const level: SkillLevel = applySkillAdvancementPurchase(skills[skillId]?.level)
      skills = { ...skills, [skillId]: { level } }
    } else {
      knownAbilities = applyAbilityTrainingPurchase(knownAbilities, purchase)
    }
  }

  return { tier, pools, edge, effort, known_abilities: knownAbilities, skills }
}
