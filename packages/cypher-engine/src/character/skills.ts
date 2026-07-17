import type { Descriptor } from '@cypher/content'

import type { AdvancementPurchase, KnownAbility, SkillLevel } from './types.js'

const ERRORS = {
  ALREADY_MAXED:
    "This skill is already specialized — that's the maximum training level, per the rulebook",
  ABILITY_NOT_KNOWN: (id: string) =>
    `Cannot train in ability "${id}": it isn't among this character's known abilities — training requires already knowing the ability`,
}

/**
 * Seeds a skill-level map from a Descriptor's structured skill_bonuses
 * (-> trained) and skill_inabilities (-> inability). Descriptor.initial_bonus
 * is separate, freeform text and is never auto-applied — see character.ts.
 */
export function applyDescriptorSkills(
  descriptor: Pick<Descriptor, 'skill_bonuses' | 'skill_inabilities'>,
): Record<string, { level: SkillLevel }> {
  const skills: Record<string, { level: SkillLevel }> = {}

  for (const skillId of descriptor.skill_bonuses) {
    skills[skillId] = { level: 'trained' }
  }
  for (const skillId of descriptor.skill_inabilities) {
    skills[skillId] = { level: 'inability' }
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
      throw new Error(ERRORS.ALREADY_MAXED)
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
  if (!known) throw new Error(ERRORS.ABILITY_NOT_KNOWN(targetId))

  return knownAbilities.map((ability) =>
    ability.ability_id === targetId ? { ...ability, trained: true } : ability,
  )
}
