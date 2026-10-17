import type {
  AdvancementPurchase,
  CharacterChoices,
  DescriptorPoolChoice,
  Stat,
} from '@cypher/engine'

// GraphQL input shapes (camelCase), mirroring schema.graphql's
// CharacterChoicesInput family. The Stat enum's internal value (see
// resolvers/content/enums.ts) is the same lowercase string @cypher/engine's
// own Stat type uses, so no enum translation is needed here — GraphQL's
// input coercion already hands these functions the lowercase form.

export interface StatAllocationInput {
  might: number
  speed: number
  intellect: number
}

export interface DescriptorPoolBonusInput {
  stat: Stat
  amount: number
}

// @oneOf: exactly one field is set.
export interface DescriptorPoolChoiceInput {
  allocation?: StatAllocationInput | null
  optionIndex?: number | null
}

export interface FocusChoiceSelectionInput {
  tier: number
  abilityId: string
}

export interface TypeAbilityPickInput {
  tier: number
  abilityId: string
}

export interface AbilitySkillChoiceInput {
  key: string
  skillIds: string[]
}

export interface AbilityChoiceInput {
  key: string
  abilityIds: string[]
}

export interface AbilityEdgeChoiceInput {
  key: string
  stat: Stat
}

export interface FlavorGainInput {
  flavorId: string
  swaps: Array<{ tier: number; replaces: string; with: string }>
}

export interface LearnedOptionInput {
  abilityId: string
  optionIds: string[]
}

export interface IncreasingCapabilitiesPurchaseInput {
  tier: number
  statPoolAllocation: StatAllocationInput
}

export interface MovingTowardPerfectionPurchaseInput {
  tier: number
  edgeStat: Stat
}

export interface ExtraEffortPurchaseInput {
  tier: number
}

export interface SkillsPurchaseTargetInput {
  skillId?: string | null
  abilityId?: string | null
}

export interface SkillsPurchaseInput {
  tier: number
  target: SkillsPurchaseTargetInput
}

export interface OtherOptionPurchaseInput {
  tier: number
}

export interface TypeAbilityPurchaseInput {
  tier: number
  abilityId: string
}

export interface FocusAbilityPurchaseInput {
  tier: number
  abilityIds: string[]
}

export interface AdvancementPurchaseInput {
  increasingCapabilities?: IncreasingCapabilitiesPurchaseInput | null
  movingTowardPerfection?: MovingTowardPerfectionPurchaseInput | null
  extraEffort?: ExtraEffortPurchaseInput | null
  skills?: SkillsPurchaseInput | null
  reduceArmorSpeedCost?: OtherOptionPurchaseInput | null
  recoveryRollBonus?: OtherOptionPurchaseInput | null
  typeAbility?: TypeAbilityPurchaseInput | null
  focusAbility?: FocusAbilityPurchaseInput | null
}

export interface CharacterChoicesInput {
  typeId: string
  descriptorId: string
  focusId: string
  flavorId?: string | null
  startingEdgeChoice?: Stat | null
  poolPointAllocation: StatAllocationInput
  // Deprecated and ignored: the engine reads the Descriptor's Pool bonuses
  // from content. Still accepted so an app deployed before the API doesn't
  // get "unknown field" errors.
  descriptorPoolBonus?: DescriptorPoolBonusInput | null
  descriptorPoolChoice?: DescriptorPoolChoiceInput | null
  tier1TypeAbilityIds: string[]
  focusChoiceSelections: FocusChoiceSelectionInput[]
  typeAbilityPicks?: TypeAbilityPickInput[] | null
  descriptorSkillChoices: string[]
  abilitySkillChoices?: AbilitySkillChoiceInput[] | null
  abilityChoices?: AbilityChoiceInput[] | null
  abilityEdgeChoices?: AbilityEdgeChoiceInput[] | null
  learnedOptions?: LearnedOptionInput[] | null
  flavorGain?: FlavorGainInput | null
  advancementPurchases: AdvancementPurchaseInput[]
}

type SkillsPurchaseTarget = Extract<AdvancementPurchase, { option: 'skills' }>['target']

function mapSkillsPurchaseTarget(input: SkillsPurchaseTargetInput): SkillsPurchaseTarget {
  if (input.skillId != null) return { kind: 'skill', skill_id: input.skillId }
  if (input.abilityId != null) return { kind: 'ability', ability_id: input.abilityId }
  throw new Error('SkillsPurchaseTargetInput must have exactly one of skillId/abilityId set')
}

// The GraphQL @oneOf discriminant is *which field is populated*
// (increasingCapabilities/movingTowardPerfection/extraEffort/skills/…), not an
// explicit string tag — @cypher/engine's `option`, by contrast, IS an
// explicit kebab-case string literal. That translation is hand-written here
// and isn't checked by the type system (a typo like 'increasingCapabilities'
// instead of 'increasing-capabilities' is still a valid `string`), so its
// unit tests must assert the exact literal, not just that mapping succeeds.
export function mapAdvancementPurchase(input: AdvancementPurchaseInput): AdvancementPurchase {
  if (input.increasingCapabilities) {
    const { tier, statPoolAllocation } = input.increasingCapabilities
    return { tier, option: 'increasing-capabilities', stat_pool_allocation: statPoolAllocation }
  }
  if (input.movingTowardPerfection) {
    const { tier, edgeStat } = input.movingTowardPerfection
    return { tier, option: 'moving-toward-perfection', edge_stat: edgeStat }
  }
  if (input.extraEffort) {
    return { tier: input.extraEffort.tier, option: 'extra-effort' }
  }
  if (input.skills) {
    const { tier, target } = input.skills
    return { tier, option: 'skills', target: mapSkillsPurchaseTarget(target) }
  }
  if (input.reduceArmorSpeedCost) {
    return { tier: input.reduceArmorSpeedCost.tier, option: 'reduce-armor-speed-cost' }
  }
  if (input.recoveryRollBonus) {
    return { tier: input.recoveryRollBonus.tier, option: 'recovery-roll-bonus' }
  }
  if (input.typeAbility) {
    const { tier, abilityId } = input.typeAbility
    return { tier, option: 'type-ability', ability_id: abilityId }
  }
  if (input.focusAbility) {
    const { tier, abilityIds } = input.focusAbility
    return { tier, option: 'focus-ability', ability_ids: abilityIds }
  }
  // Unreachable in practice: the schema's @oneOf directive guarantees
  // exactly one field is set before this resolver ever runs.
  throw new Error('AdvancementPurchaseInput must have exactly one variant set')
}

export function mapDescriptorPoolChoice(input: DescriptorPoolChoiceInput): DescriptorPoolChoice {
  if (input.allocation) return { allocation: input.allocation }
  if (input.optionIndex != null) return { option_index: input.optionIndex }
  // Unreachable in practice: the schema's @oneOf directive guarantees
  // exactly one field is set.
  throw new Error('DescriptorPoolChoiceInput must have exactly one of allocation/optionIndex set')
}

export function mapFocusChoiceSelections(
  list: FocusChoiceSelectionInput[],
): Record<string, string[]> {
  return groupByTier(list)
}

export function mapTypeAbilityPicks(list: TypeAbilityPickInput[]): Record<string, string[]> {
  return groupByTier(list)
}

function groupByTier(list: Array<{ tier: number; abilityId: string }>): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  for (const { tier, abilityId } of list) (grouped[String(tier)] ??= []).push(abilityId)
  return grouped
}

export function mapAbilitySkillChoices(list: AbilitySkillChoiceInput[]): Record<string, string[]> {
  return Object.fromEntries(list.map(({ key, skillIds }) => [key, skillIds]))
}

export function mapAbilityChoices(list: AbilityChoiceInput[]): Record<string, string[]> {
  return Object.fromEntries(list.map(({ key, abilityIds }) => [key, abilityIds]))
}

export function mapAbilityEdgeChoices(list: AbilityEdgeChoiceInput[]): Record<string, Stat> {
  return Object.fromEntries(list.map(({ key, stat }) => [key, stat]))
}

export function mapLearnedOptions(list: LearnedOptionInput[]): Record<string, string[]> {
  const learned: Record<string, string[]> = {}
  for (const { abilityId, optionIds } of list) {
    learned[abilityId] = [...(learned[abilityId] ?? []), ...optionIds]
  }
  return learned
}

export function mapCharacterChoicesInput(input: CharacterChoicesInput): CharacterChoices {
  return {
    type_id: input.typeId,
    descriptor_id: input.descriptorId,
    focus_id: input.focusId,
    ...(input.flavorId != null ? { flavor_id: input.flavorId } : {}),
    ...(input.flavorGain
      ? {
          flavor_gain: {
            flavor_id: input.flavorGain.flavorId,
            swaps: input.flavorGain.swaps.map(({ tier, replaces, with: taken }) => ({
              tier,
              replaces,
              with: taken,
            })),
          },
        }
      : {}),
    ...(input.startingEdgeChoice != null ? { starting_edge_choice: input.startingEdgeChoice } : {}),
    pool_point_allocation: input.poolPointAllocation,
    ...(input.descriptorPoolChoice
      ? { descriptor_pool_choice: mapDescriptorPoolChoice(input.descriptorPoolChoice) }
      : {}),
    tier_1_type_ability_ids: input.tier1TypeAbilityIds,
    focus_choice_selections: mapFocusChoiceSelections(input.focusChoiceSelections),
    ...((input.typeAbilityPicks ?? []).length > 0
      ? { type_ability_picks: mapTypeAbilityPicks(input.typeAbilityPicks ?? []) }
      : {}),
    descriptor_skill_choices: input.descriptorSkillChoices,
    ...((input.abilitySkillChoices ?? []).length > 0
      ? { ability_skill_choices: mapAbilitySkillChoices(input.abilitySkillChoices ?? []) }
      : {}),
    ...((input.abilityChoices ?? []).length > 0
      ? { ability_choices: mapAbilityChoices(input.abilityChoices ?? []) }
      : {}),
    ...((input.abilityEdgeChoices ?? []).length > 0
      ? { ability_edge_choices: mapAbilityEdgeChoices(input.abilityEdgeChoices ?? []) }
      : {}),
    ...((input.learnedOptions ?? []).length > 0
      ? { learned_options: mapLearnedOptions(input.learnedOptions ?? []) }
      : {}),
    advancement_purchases: input.advancementPurchases.map(mapAdvancementPurchase),
  }
}
