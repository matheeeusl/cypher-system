import type {
  AdvancementPurchaseInput,
  CharacterChoicesInput,
  FocusTierAbilityEntry,
  WizardAbility,
  WizardDescriptor,
  WizardFlavor,
  WizardFocus,
  WizardType,
  Stat,
} from '@/lib/graphql/queries'

import type { WizardCopy } from '@/lib/i18n/wizard'
import { EMPTY_PICKS, flavorIdInUse, type TierPicks } from '@/lib/tier-picks'

import {
  POOL_POINTS_TOTAL,
  STEPS,
  TIER1_TYPE_ABILITY_COUNT,
  type DescriptorPoolChoice,
  type PoolAllocation,
  type StepId,
  type WizardChoices,
} from './state'

export interface WizardContent {
  type?: WizardType | undefined
  descriptor?: WizardDescriptor | undefined
  focus?: WizardFocus | undefined
  /** The chosen flavor; must be loaded whenever `choices.flavorId` is set. */
  flavor?: WizardFlavor | undefined
  /** The ability catalog; needed to know which abilities grant skills. */
  abilities?: WizardAbility[] | undefined
}

/**
 * The tier-1 abilities the player picks their four from: the Type's list, then
 * the flavor's (a flavor widens the pool; it doesn't change how many are
 * picked). An ability both offer is listed once, as the Type's.
 */
export function tier1PickPool(
  type: WizardType | undefined,
  flavor: WizardFlavor | undefined,
): Array<{ id: string; fromFlavor: boolean }> {
  const ofType = type?.tierAbilities.find((g) => g.tier === 1)?.abilityIds ?? []
  const ofFlavor = flavor?.tierAbilities.find((g) => g.tier === 1)?.abilityIds ?? []
  const typeIds = new Set(ofType)
  return [
    ...ofType.map((id) => ({ id, fromFlavor: false })),
    ...ofFlavor.filter((id) => !typeIds.has(id)).map((id) => ({ id, fromFlavor: true })),
  ]
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
  /** The player may type their own skill/area instead of picking from the catalog. */
  allowCustom: boolean
  /** A second shape, with its own pick count, instead of `count`. */
  alternate: { count: number; mode: 'train' | 'train_or_specialize' | 'specialize' } | null
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
          alternate: grant.alternate,
          allowCustom: grant.allowCustom,
          noncombat: grant.noncombat,
          options: grant.options,
        },
      ]
    }),
  )
}

export interface ChoiceSlot {
  key: string
  abilityId: string
  /** How many of `options` the player must pick. */
  count: number
  options: string[]
}

/**
 * The tier-1 picks that ask for more picks (Blessing of the Gods: two of its
 * blessings; Cantrips: four cantrips), one slot each. Their key is a Type key
 * even when the ability comes from a flavor — the engine's `abilityChoiceKey`.
 */
export function tier1ChoiceSlots(choices: WizardChoices, content: WizardContent): ChoiceSlot[] {
  const { abilities } = content
  if (!abilities) return []
  return [...new Set(choices.tier1TypeAbilityIds)].flatMap((abilityId): ChoiceSlot[] => {
    const choice = abilities.find((a) => a.id === abilityId)?.choice
    if (!choice) return []
    return [
      {
        key: skillGrantKey('type', 1, abilityId),
        abilityId,
        count: choice.count,
        options: choice.options,
      },
    ]
  })
}

export interface EdgeSlot {
  key: string
  abilityId: string
  /** The Edges at 0 when the ability is gained — the only ones it may raise. */
  options: Stat[]
}

const STATS: Stat[] = ['MIGHT', 'SPEED', 'INTELLECT']

/**
 * The tier-1 abilities that raise an Edge the player picks (Improved Edge), one
 * slot each. Same order as @cypher/engine's deriveEdge: the Type's starting
 * Edge, then the Type picks, then the Focus abilities, each grant applied as it
 * comes — so `options` are the Edges still at 0 when the ability is gained.
 * A pick that is no longer among them (the starting Edge changed) doesn't count.
 */
export function tier1EdgeSlots(choices: WizardChoices, content: WizardContent): EdgeSlot[] {
  const { abilities, type, focus } = content
  if (!abilities || !type) return []

  const edge: Record<Stat, number> = { MIGHT: 0, SPEED: 0, INTELLECT: 0 }
  const { statChoices, amount } = type.startingEdge
  const startingStat = statChoices.length > 1 ? choices.startingEdgeChoice : statChoices[0]
  if (startingStat) edge[startingStat] = amount

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

  const slots: EdgeSlot[] = []
  for (const { kind, ids } of sources) {
    for (const abilityId of new Set(ids)) {
      const grant = abilities.find((a) => a.id === abilityId)?.edgeGrant
      if (!grant) continue
      if (grant.kind === 'fixed') {
        if (grant.stat) edge[grant.stat] += grant.amount ?? 0
        continue
      }
      const key = skillGrantKey(kind, 1, abilityId)
      const options = STATS.filter((stat) => edge[stat] === 0)
      // Nothing at 0: there's nothing to pick (the engine owes nothing either).
      if (options.length === 0) continue
      slots.push({ key, abilityId, options })
      const picked = choices.abilityEdgeChoices[key]
      if (picked && options.includes(picked)) edge[picked] = 1
    }
  }
  return slots
}

/** The slot's pick, if it is still one of the Edges it may raise. */
export function currentEdgePick(slot: EdgeSlot, choices: WizardChoices): Stat | null {
  const picked = choices.abilityEdgeChoices[slot.key]
  return picked && slot.options.includes(picked) ? picked : null
}

const POOL_KEY: Record<Stat, keyof PoolAllocation> = {
  MIGHT: 'might',
  SPEED: 'speed',
  INTELLECT: 'intellect',
}

/**
 * The player's answer if it fits the Descriptor's choice (an allocation for
 * points to divide, an index for one-of), else null — an answer left over from
 * another Descriptor would be rejected by the API as unexpected.
 */
export function currentPoolChoice(
  descriptor: WizardDescriptor | undefined,
  choice: DescriptorPoolChoice | null,
): DescriptorPoolChoice | null {
  const kind = descriptor?.poolBonusChoice?.__typename
  if (!choice || !kind) return null
  if (kind === 'DescriptorPoolDivide') return 'allocation' in choice ? choice : null
  return 'optionIndex' in choice ? choice : null
}

/**
 * Whether the Descriptor's Pool bonus choice is fully answered (true when it
 * has none). Same rules as @cypher/engine's resolveDescriptorPoolChoice:
 * divide exactly the points, only among the offered stats; or pick an option
 * that exists.
 */
export function descriptorPoolChoiceComplete(
  descriptor: WizardDescriptor | undefined,
  choice: DescriptorPoolChoice | null,
): boolean {
  const offered = descriptor?.poolBonusChoice
  if (!offered) return true
  const answer = currentPoolChoice(descriptor, choice)
  if (!answer) return false
  if (offered.__typename === 'DescriptorPoolOneOf') {
    return (
      'optionIndex' in answer &&
      answer.optionIndex >= 0 &&
      answer.optionIndex < offered.options.length
    )
  }
  if (!('allocation' in answer)) return false
  const allowed = new Set(offered.stats.map((stat) => POOL_KEY[stat]))
  const entries = Object.entries(answer.allocation) as Array<[keyof PoolAllocation, number]>
  return (
    entries.every(([key, points]) => points >= 0 && (points === 0 || allowed.has(key))) &&
    entries.reduce((sum, [, points]) => sum + points, 0) === offered.points
  )
}

/**
 * Points the Descriptor adds to each Pool: every fixed bonus, plus the
 * player's choice (as far as it goes, so the preview moves while they divide).
 */
export function descriptorPoolBonus(
  descriptor: WizardDescriptor | undefined,
  choice: DescriptorPoolChoice | null,
): PoolAllocation {
  const total: PoolAllocation = { might: 0, speed: 0, intellect: 0 }
  if (!descriptor) return total
  for (const bonus of descriptor.poolBonus) total[POOL_KEY[bonus.stat]] += bonus.amount
  const answer = currentPoolChoice(descriptor, choice)
  const offered = descriptor.poolBonusChoice
  if (answer && 'allocation' in answer) {
    for (const key of ['might', 'speed', 'intellect'] as const) total[key] += answer.allocation[key]
  } else if (answer && offered?.__typename === 'DescriptorPoolOneOf') {
    for (const bonus of offered.options[answer.optionIndex] ?? []) {
      total[POOL_KEY[bonus.stat]] += bonus.amount
    }
  }
  return total
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

/** The auto-granted skills that start specialized (the Elf's perception) —
 * already at the maximum, so no ability can train or specialize them. */
export function descriptorSpecializedSkillIds(descriptor: WizardDescriptor | undefined): string[] {
  if (!descriptor) return []
  return descriptor.skillTraining
    .filter((entry) => entry.level === 'SPECIALIZED')
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
      return (
        choices.descriptorId !== null &&
        descriptorPoolChoiceComplete(content.descriptor, choices.descriptorPoolChoice)
      )
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
      if (!choiceSlotsComplete(choices, content)) return false
      if (!edgeSlotsComplete(choices, content)) return false
      return tier1SkillGrantSlots(choices, content).every((slot) => {
        const picked = (choices.abilitySkillChoices[slot.key] ?? []).length
        return picked === slot.count || picked === slot.alternate?.count
      })
    }
    case 'equipment':
      return true
    case 'background':
      return choices.name.trim().length > 0
    case 'review':
      return true
  }
}

/**
 * Index of the furthest step the player may open: the first step that isn't
 * complete yet (it can be opened so it can be filled in), or the last step
 * when every one is complete. Steps after it stay locked in the stepper.
 * Steps that need nothing (Equipment) are always complete, so they never lock.
 */
export function furthestReachableStep(choices: WizardChoices, content: WizardContent): number {
  const firstIncomplete = STEPS.findIndex((s) => !isStepValid(s.id, choices, content))
  return firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete
}

/**
 * The wizard step where the player fixes an engine validation issue, from its
 * code. The live validation checks the whole character at once, so without
 * this a player on the Focus step would already see errors about Pools or
 * abilities they haven't reached. Unknown codes go to Review, the last step.
 */
export function issueStepId(code: string): StepId {
  if (code.startsWith('STARTING_EDGE_')) return 'type'
  if (code.startsWith('DESCRIPTOR_POOL_CHOICE_')) return 'descriptor'
  if (code.startsWith('POOL_')) return 'pools'
  if (code.startsWith('SKILL_')) return 'skills'
  if (
    code.startsWith('FOCUS_') ||
    code.startsWith('TYPE_ABILITY_') ||
    code.startsWith('ABILITY_') ||
    code.startsWith('EDGE_CHOICE_') ||
    code === 'FLAVOR_UNKNOWN'
  ) {
    // Focus choices, flavors and ability picks are all made on the Abilities step.
    return 'abilities'
  }
  return 'review'
}

function choiceSlotsComplete(choices: WizardChoices, content: WizardContent): boolean {
  return tier1ChoiceSlots(choices, content).every(
    (slot) => (choices.abilityChoices[slot.key] ?? []).length === slot.count,
  )
}

function edgeSlotsComplete(choices: WizardChoices, content: WizardContent): boolean {
  return tier1EdgeSlots(choices, content).every((slot) => currentEdgePick(slot, choices) !== null)
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
      if (!choices.descriptorId) return copy.selectDescriptor
      return copy.descriptorPoolChoice
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
      if (!choiceSlotsComplete(choices, content)) return copy.abilityOptions
      if (!edgeSlotsComplete(choices, content)) return copy.abilityEdge
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

  // A flavor the wizard can't resolve (still loading) can't be validated yet. The
  // flavor in use is the one chosen at creation, or else the one gained in play.
  const flavorId = flavorIdInUse(choices, tierPicks)
  if (flavorId !== null && content.flavor?.id !== flavorId) return null

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

  // Same rule for the abilities picked for choice abilities: only those the
  // character still has. Tier 2+ answers come from tierPicks.
  const currentChoiceKeys = new Set(tier1ChoiceSlots(choices, content).map((slot) => slot.key))
  const abilityChoices = [
    ...Object.entries(choices.abilityChoices)
      .filter(([key]) => currentChoiceKeys.has(key))
      .map(([key, abilityIds]) => ({ key, abilityIds })),
    ...Object.entries(tierPicks.options ?? {}).map(([key, abilityIds]) => ({ key, abilityIds })),
  ]

  // Only Edge picks that still apply: the ability is still chosen and the
  // Edge is still at 0. A stale one is left for the step to ask again.
  const abilityEdgeChoices = [
    ...tier1EdgeSlots(choices, content).flatMap((slot) => {
      const stat = currentEdgePick(slot, choices)
      return stat ? [{ key: slot.key, stat }] : []
    }),
    ...Object.entries(tierPicks.edges ?? {}).map(([key, stat]) => ({ key, stat })),
  ]

  const descriptorPoolChoice = currentPoolChoice(descriptor, choices.descriptorPoolChoice)

  const learnedOptions = Object.entries(tierPicks.learned ?? {}).map(([abilityId, optionIds]) => ({
    abilityId,
    optionIds,
  }))

  return {
    typeId: choices.typeId,
    descriptorId: choices.descriptorId,
    focusId: choices.focusId,
    ...(choices.flavorId ? { flavorId: choices.flavorId } : {}),
    ...(choices.startingEdgeChoice ? { startingEdgeChoice: choices.startingEdgeChoice } : {}),
    // The fixed Descriptor Pool bonuses aren't sent: graphql-api applies them
    // from content. Only the player's answer to a choice is.
    poolPointAllocation: choices.poolAllocation,
    ...(descriptorPoolChoice ? { descriptorPoolChoice } : {}),
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
    ...(abilityChoices.length > 0 ? { abilityChoices } : {}),
    ...(abilityEdgeChoices.length > 0 ? { abilityEdgeChoices } : {}),
    ...(learnedOptions.length > 0 ? { learnedOptions } : {}),
    ...(tierPicks.flavorGain
      ? {
          flavorGain: {
            flavorId: tierPicks.flavorGain.flavorId,
            swaps: tierPicks.flavorGain.swaps,
          },
        }
      : {}),
    advancementPurchases,
  }
}
