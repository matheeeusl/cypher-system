import type { Descriptor } from '@cypher/content'

import type { AdvancementPurchase, KnownAbility, SkillLevel } from './types.js'
import { CharacterRuleError } from '../errors.js'

const ERRORS = {
  ALREADY_MAXED:
    "This skill is already specialized — that's the maximum training level, per the rulebook",
  ABILITY_NOT_KNOWN: (id: string) =>
    `Cannot train in ability "${id}": it isn't among this character's known abilities — training requires already knowing the ability`,
  WRONG_CHOICE_COUNT: (required: number) =>
    `Exactly ${required} descriptor_skill_choices must be chosen, to match the Descriptor's skill_training choice_count entries`,
  DUPLICATE_CHOICE: 'descriptor_skill_choices contains a duplicate',
}

/**
 * Seeds a skill-level map from a Descriptor's structured skill_training:
 * entries with a specific skill_id are auto-applied as trained, entries
 * with a choice_count are filled in from the player-chosen
 * descriptorSkillChoices. Descriptor.inabilities is prose, not skill ids —
 * often a whole task category rather than a single skill — so it's never
 * auto-applied; see "Known gaps" in this package's CLAUDE.md.
 */
export function applyDescriptorSkills(
  descriptor: Pick<Descriptor, 'skill_training'>,
  descriptorSkillChoices: string[],
): Record<string, { level: SkillLevel }> {
  const skills: Record<string, { level: SkillLevel }> = {}

  const requiredChoiceCount = descriptor.skill_training.reduce(
    (sum, entry) => sum + (entry.choice_count ?? 0),
    0,
  )
  if (descriptorSkillChoices.length !== requiredChoiceCount) {
    throw new CharacterRuleError(
      'SKILL_CHOICE_COUNT',
      ERRORS.WRONG_CHOICE_COUNT(requiredChoiceCount),
      { required: requiredChoiceCount },
    )
  }
  if (new Set(descriptorSkillChoices).size !== descriptorSkillChoices.length) {
    throw new CharacterRuleError('SKILL_CHOICE_DUPLICATE', ERRORS.DUPLICATE_CHOICE)
  }

  for (const entry of descriptor.skill_training) {
    if (entry.skill_id !== null) {
      skills[entry.skill_id] = { level: 'trained' }
    }
  }
  for (const skillId of descriptorSkillChoices) {
    skills[skillId] = { level: 'trained' }
  }

  return skills
}

/**
 * Applies one 'skills' advancement purchase (target.kind === 'skill') to a
 * skill's current level. Per the rulebook: training an inability makes you
 * practiced (removes the inability); training a practiced skill makes you
 * trained; training an already-trained skill makes you specialized —
 * specialized is the maximum, so training it again is invalid.
 */
export function applySkillAdvancementPurchase(currentLevel: SkillLevel | undefined): SkillLevel {
  switch (currentLevel ?? 'practiced') {
    case 'inability':
      return 'practiced'
    case 'practiced':
      return 'trained'
    case 'trained':
      return 'specialized'
    case 'specialized':
      throw new CharacterRuleError('SKILL_ALREADY_MAXED', ERRORS.ALREADY_MAXED)
  }
}

/**
 * Applies one 'skills' advancement purchase (target.kind === 'ability') by
 * marking an already-known ability as trained. This operates on
 * known_abilities rather than the skills map — the rulebook only lets a
 * character train in an ability they already have from Type or Focus, it
 * doesn't grant a new one.
 */
export function applyAbilityTrainingPurchase(
  knownAbilities: KnownAbility[],
  purchase: Extract<AdvancementPurchase, { option: 'skills' }>,
): KnownAbility[] {
  if (purchase.target.kind !== 'ability') return knownAbilities

  const targetId = purchase.target.ability_id
  const known = knownAbilities.some((ability) => ability.ability_id === targetId)
  if (!known)
    throw new CharacterRuleError('ABILITY_TRAINING_UNKNOWN', ERRORS.ABILITY_NOT_KNOWN(targetId), {
      abilityId: targetId,
    })

  return knownAbilities.map((ability) =>
    ability.ability_id === targetId ? { ...ability, trained: true } : ability,
  )
}
