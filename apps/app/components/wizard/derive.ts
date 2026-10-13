import type {
  AdvancementPurchaseInput,
  CharacterChoicesInput,
  FocusTierAbilityEntry,
  WizardAbility,
  WizardDescriptor,
  WizardFocus,
  WizardType,
} from '@/lib/graphql/queries'

import type { WizardCopy } from '@/lib/i18n/wizard'
import { EMPTY_PICKS, type TierPicks } from '@/lib/tier-picks'

import {
  POOL_POINTS_TOTAL,
  TIER1_TYPE_ABILITY_COUNT,
  type StepId,
  type WizardChoices,
} from './state'

export interface WizardContent {
  type?: WizardType | undefined
  descriptor?: WizardDescriptor | undefined
  focus?: WizardFocus | undefined
  /** The ability catalog; needed to know which abilities grant skills. */
  abilities?: WizardAbility[] | undefined
}

/**
 * The `abilitySkillChoices` key for an ability gained from a Type or Focus at
 * a tier. Must match @cypher/engine's `skillGrantKey` (the app doesn't import
 * the engine): `<type|focus>:<tier>:<abilityId>`.
 */
export function skillGrantKey(kind: 'type' | 'focus', tier: number, abilityId: string): string {
  return `${kind}:${tier}:${abilityId}`
}

export interface SkillGrantSlot {
  key: string
  abilityId: string
  count: number
  mode: 'train' | 'train_or_specialize' | 'specialize'
  /** Any skill not flagged `combat` may be picked (`options` is then empty). */
  noncombat: boolean
  options: string[]
}

/**
 * The skill-granting abilities among the character's tier-1 picks: the chosen
 * Type abilities, the Focus's automatic grants and the Focus option(s) picked.
 * (Skill grants gained at tier 2+ are answered in play mode.) The Type's
 * special ability isn't looked at — none grants skills today; if one starts to,
 * the engine reports it as a pending pick and play mode asks for it.
 */
export function tier1SkillGrantSlots(
  choices: WizardChoices,
  content: WizardContent,
): SkillGrantSlot[] {
  const { abilities, focus } = content
  if (!abilities) return []

  const focusChosenIds = focus
    ? focusTier1ChoiceEntries(focus).flatMap((entry, i) =>
        (choices.focusChoiceSelections[i] ?? []).flatMap(
          (optionIndex) => entry.options[optionIndex] ?? [],
        ),
      )
    : []
  const sources: Array<{ kind: 'type' | 'focus'; ids: string[] }> = [
    { kind: 'type', ids: choices.tier1TypeAbilityIds },
    { kind: 'focus', ids: [...(focus ? focusTier1GrantedIds(focus) : []), ...focusChosenIds] },
  ]

  return sources.flatMap(({ kind, ids }) =>
    [...new Set(ids)].flatMap((abilityId): SkillGrantSlot[] => {
      const grant = abilities.find((a) => a.id === abilityId)?.skillGrant
      if (!grant) return []
      return [
        {
          key: skillGrantKey(kind, 1, abilityId),
          abilityId,
          count: grant.count,
          mode: grant.mode,
          noncombat: grant.noncombat,
          options: grant.options,
        },
      ]
    }),
  )
}

/** Sum of a Descriptor's skill_training choice_count entries — the number of
 * skills the player must pick beyond whatever's auto-granted. */
export function descriptorSkillChoicesNeeded(descriptor: WizardDescriptor | undefined): number {
  if (!descriptor) return 0
  return descriptor.skillTraining.reduce((sum, entry) => sum + (entry.choiceCount ?? 0), 0)
}

/** Skill ids a Descriptor auto-grants (fixed skillId entries) — trained
 * automatically, never part of the player's choice. */
export function descriptorAutoTrainedSkillIds(descriptor: WizardDescriptor | undefined): string[] {
  if (!descriptor) return []
  return descriptor.skillTraining
    .map((entry) => entry.skillId)
    .filter((id): id is string => id !== null)
}

/** A Focus's tier-1 ChoiceAbility entries — most Foci have none (every
 * tier-1 ability is auto-granted). `options` is a list of option-bundles
 * (usually 1 ability id each, occasionally 2 for a bundled-pair option);
 * `count` is how many *bundles* to pick, not how many total ability ids
 * (Channels Divine Blessings is a real pick-2-of-11 at tier 1). */
export function focusTier1ChoiceEntries(
  focus: WizardFocus | undefined,
): Array<{ tier: number; options: string[][]; count: number }> {
  if (!focus) return []
  const tier1 = focus.tierAbilities.find((group) => group.tier === 1)
  if (!tier1) return []
  return tier1.entries
    .filter(
      (entry): entry is Extract<FocusTierAbilityEntry, { __typename: 'ChoiceAbility' }> =>
        entry.__typename === 'ChoiceAbility',
    )
    .map((entry) => ({ tier: tier1.tier, options: entry.options, count: entry.count }))
}

/** A Focus's tier-1 auto-granted ability ids. */
export function focusTier1GrantedIds(focus: WizardFocus | undefined): string[] {
  if (!focus) return []
  const tier1 = focus.tierAbilities.find((group) => group.tier === 1)
  if (!tier1) return []
  return tier1.entries
    .filter(
      (entry): entry is Extract<FocusTierAbilityEntry, { __typename: 'GrantedAbility' }> =>
        entry.__typename === 'GrantedAbility',
    )
    .map((entry) => entry.abilityId)
}

export function isStepValid(
  stepId: StepId,
  choices: WizardChoices,
  content: WizardContent,
): boolean {
  switch (stepId) {
    case 'type': {
      if (!choices.typeId) return false
      const needsEdgeChoice = (content.type?.startingEdge.statChoices.length ?? 0) > 1
      return !needsEdgeChoice || choices.startingEdgeChoice !== null
    }
    case 'descriptor':
      return choices.descriptorId !== null
    case 'focus':
      // Focus-choice selections (e.g. Channels Divine Blessings' pick-2-of-13)
      // are picked on the Abilities step, not here — this step only gates on
      // having chosen a Focus at all, so it doesn't block the player at a
      // step with no UI to satisfy the deeper requirement.
      return choices.focusId !== null
    case 'pools': {
      const { might, speed, intellect } = choices.poolAllocation
      return might + speed + intellect === POOL_POINTS_TOTAL
    }
    case 'skills':
      return (
        choices.descriptorSkillChoices.length === descriptorSkillChoicesNeeded(content.descriptor)
      )
    case 'abilities': {
      if (choices.tier1TypeAbilityIds.length !== TIER1_TYPE_ABILITY_COUNT) return false
      const choiceEntries = focusTier1ChoiceEntries(content.focus)
      if (
        !choiceEntries.every(
          (entry, i) => (choices.focusChoiceSelections[i] ?? []).length === entry.count,
        )
      ) {
        return false
      }
      return tier1SkillGrantSlots(choices, content).every(
        (slot) => (choices.abilitySkillChoices[slot.key] ?? []).length === slot.count,
      )
    }
    case 'equipment':
      return true
    case 'background':
      return choices.name.trim().length > 0
    case 'review':
      return true
  }
}

function focusChoicesComplete(choices: WizardChoices, content: WizardContent): boolean {
  return focusTier1ChoiceEntries(content.focus).every(
    (entry, i) => (choices.focusChoiceSelections[i] ?? []).length === entry.count,
  )
}

export function stepErrorMessage(
  stepId: StepId,
  choices: WizardChoices,
  content: WizardContent,
  copy: WizardCopy['stepErrors'],
): string {
  switch (stepId) {
    case 'type': {
      if (!choices.typeId) return copy.selectType
      const needsEdgeChoice = (content.type?.startingEdge.statChoices.length ?? 0) > 1
      if (needsEdgeChoice && choices.startingEdgeChoice === null) return copy.chooseEdge
      return ''
    }
    case 'descriptor':
      return copy.selectDescriptor
    case 'focus':
      return copy.selectFocus
    case 'pools': {
      const { might, speed, intellect } = choices.poolAllocation
      const spent = might + speed + intellect
      if (spent > POOL_POINTS_TOTAL) return copy.overspent(spent - POOL_POINTS_TOTAL)
      return copy.allocateAll
    }
    case 'skills':
      return copy.chooseSkills(descriptorSkillChoicesNeeded(content.descriptor))
    case 'abilities': {
      if (choices.tier1TypeAbilityIds.length !== TIER1_TYPE_ABILITY_COUNT) {
        return copy.chooseAbilities(TIER1_TYPE_ABILITY_COUNT)
      }
      if (!focusChoicesComplete(choices, content)) return copy.focusChoices
      return copy.abilitySkills
    }
    case 'background':
      return copy.enterName
    case 'equipment':
    case 'review':
      return ''
  }
}

/**
 * Builds the CharacterChoicesInput for validateCharacterChoices as soon as
 * Type/Descriptor/Focus are all picked — even before Pools/Skills/Abilities
 * are finished, so the live-validation panel can surface the API's own
 * "must sum to exactly 6" style errors as the player works through the rest
 * of the wizard, rather than only checking client-side.
 */
/** {tier -> ids} to the API's flat {tier, abilityId} pairs. */
function pairsOf(record: Record<string, string[]>) {
  return Object.entries(record).flatMap(([tier, ids]) =>
    ids.map((abilityId) => ({ tier: Number(tier), abilityId })),
  )
}

export function buildCharacterChoicesInput(
  choices: WizardChoices,
  content: WizardContent,
  advancementPurchases: AdvancementPurchaseInput[] = [],
  tierPicks: TierPicks = EMPTY_PICKS,
): CharacterChoicesInput | null {
  const { type, descriptor, focus } = content
  if (
    !type ||
    !descriptor ||
    !focus ||
    !choices.typeId ||
    !choices.descriptorId ||
    !choices.focusId
  ) {
    return null
  }

  const poolBonus = descriptor.poolBonus[0]
  const choiceEntries = focusTier1ChoiceEntries(focus)

  // Only tier-1 choices for abilities the character still has are sent — a
  // pick left over from an ability that was since deselected would otherwise
  // be rejected as matching nothing. Picks for tier 2+ come from tierPicks.
  const currentKeys = new Set(tier1SkillGrantSlots(choices, content).map((slot) => slot.key))
  const abilitySkillChoices = [
    ...Object.entries(choices.abilitySkillChoices)
      .filter(([key]) => currentKeys.has(key))
      .map(([key, skillIds]) => ({ key, skillIds })),
    ...Object.entries(tierPicks.skills ?? {}).map(([key, skillIds]) => ({ key, skillIds })),
  ]

  return {
    typeId: choices.typeId,
    descriptorId: choices.descriptorId,
    focusId: choices.focusId,
    ...(choices.startingEdgeChoice ? { startingEdgeChoice: choices.startingEdgeChoice } : {}),
    poolPointAllocation: choices.poolAllocation,
    ...(poolBonus
      ? { descriptorPoolBonus: { stat: poolBonus.stat, amount: poolBonus.amount } }
      : {}),
    tier1TypeAbilityIds: choices.tier1TypeAbilityIds,
    // One {tier, abilityId} pair per individual ability id — a selected
    // bundled-pair option contributes two pairs, both at the same tier; the
    // API groups them back by tier.
    focusChoiceSelections: [
      ...choiceEntries.flatMap((entry, i) =>
        (choices.focusChoiceSelections[i] ?? []).flatMap((optionIndex) =>
          (entry.options[optionIndex] ?? []).map((abilityId) => ({ tier: entry.tier, abilityId })),
        ),
      ),
      ...pairsOf(tierPicks.focus),
    ],
    ...(Object.keys(tierPicks.type).length > 0
      ? { typeAbilityPicks: pairsOf(tierPicks.type) }
      : {}),
    descriptorSkillChoices: choices.descriptorSkillChoices,
    ...(abilitySkillChoices.length > 0 ? { abilitySkillChoices } : {}),
    advancementPurchases,
  }
}
