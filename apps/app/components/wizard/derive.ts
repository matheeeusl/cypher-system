import type {
  CharacterChoicesInput,
  FocusTierAbilityEntry,
  WizardDescriptor,
  WizardFocus,
  WizardType,
} from '@/lib/graphql/queries'

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
      return choiceEntries.every(
        (entry, i) => (choices.focusChoiceSelections[i] ?? []).length === entry.count,
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

export function stepErrorMessage(
  stepId: StepId,
  choices: WizardChoices,
  content: WizardContent,
): string {
  switch (stepId) {
    case 'type': {
      if (!choices.typeId) return 'Select a Type to continue.'
      const needsEdgeChoice = (content.type?.startingEdge.statChoices.length ?? 0) > 1
      if (needsEdgeChoice && choices.startingEdgeChoice === null) {
        return 'Choose which stat gets your starting Edge.'
      }
      return ''
    }
    case 'descriptor':
      return 'Select a Descriptor to continue.'
    case 'focus':
      return 'Select a Focus to continue.'
    case 'pools': {
      const { might, speed, intellect } = choices.poolAllocation
      const spent = might + speed + intellect
      if (spent > POOL_POINTS_TOTAL)
        return `You've overspent your pool points by ${spent - POOL_POINTS_TOTAL}.`
      return 'Allocate all remaining points before continuing.'
    }
    case 'skills': {
      const needed = descriptorSkillChoicesNeeded(content.descriptor)
      return `Choose exactly ${needed} trained skill${needed === 1 ? '' : 's'}.`
    }
    case 'abilities': {
      if (choices.tier1TypeAbilityIds.length !== TIER1_TYPE_ABILITY_COUNT) {
        return `Choose exactly ${TIER1_TYPE_ABILITY_COUNT} tier-1 abilities.`
      }
      return 'Make a selection for every Focus choice above.'
    }
    case 'background':
      return 'Enter a character name to continue.'
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
export function buildCharacterChoicesInput(
  choices: WizardChoices,
  content: WizardContent,
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
    // bundled-pair option contributes two pairs, both at the same tier.
    // KNOWN GAP (not fixed here, flagged to the user): the server's
    // mapFocusChoiceSelections keys its intermediate record by tier alone,
    // so when more than one pair shares a tier only the *last* survives.
    // This is live and reachable today for Channels Divine Blessings
    // (tier-1 pick-2-of-13) — this wizard sends both chosen ability ids
    // correctly, but validateCharacterChoices currently only grants one of
    // them. Fixing it means changing @cypher/engine's
    // resolveFocusAbilities (Record<string, string> -> Record<string,
    // string[]>), not just this client.
    focusChoiceSelections: choiceEntries.flatMap((entry, i) =>
      (choices.focusChoiceSelections[i] ?? []).flatMap((optionIndex) =>
        (entry.options[optionIndex] ?? []).map((abilityId) => ({ tier: entry.tier, abilityId })),
      ),
    ),
    descriptorSkillChoices: choices.descriptorSkillChoices,
    advancementPurchases: [],
  }
}
