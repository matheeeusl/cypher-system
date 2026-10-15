import type { Stat } from '@/lib/graphql/queries'

export interface PoolAllocation {
  might: number
  speed: number
  intellect: number
}

export interface WizardChoices {
  typeId: string | null
  startingEdgeChoice: Stat | null
  descriptorId: string | null
  descriptorSkillChoices: string[]
  focusId: string | null
  // Optional. Its abilities join the pool the tier-1 Type abilities are picked
  // from (the picks themselves stay in `tier1TypeAbilityIds`).
  flavorId: string | null
  // One entry per tier-1 ChoiceAbility on the selected Focus, in the same
  // order focusTier1ChoiceEntries() returns them. Each inner array holds
  // the *option-bundle indices* currently picked for that entry (into that
  // entry's own `options` list) — length must reach entry.count to be
  // valid; almost always 0 or 1 items long, but Channels Divine Blessings
  // needs 2 (pick-2-of-13).
  focusChoiceSelections: number[][]
  poolAllocation: PoolAllocation
  tier1TypeAbilityIds: string[]
  // Skills picked for tier-1 abilities that grant skills, keyed by
  // skillGrantKey('type' | 'focus', 1, abilityId) (see derive.ts).
  abilitySkillChoices: Record<string, string[]>
  // Abilities picked for tier-1 choice abilities (Blessing of the Gods, Cantrips),
  // keyed like abilitySkillChoices (`type:1:<abilityId>`).
  abilityChoices: Record<string, string[]>
  name: string
  background: string
}

export const INITIAL_CHOICES: WizardChoices = {
  typeId: null,
  startingEdgeChoice: null,
  descriptorId: null,
  descriptorSkillChoices: [],
  focusId: null,
  flavorId: null,
  focusChoiceSelections: [],
  poolAllocation: { might: 0, speed: 0, intellect: 0 },
  tier1TypeAbilityIds: [],
  abilitySkillChoices: {},
  abilityChoices: {},
  name: '',
  background: '',
}

export const POOL_POINTS_TOTAL = 6
// Uniform "choose four" rule for tier-1 Type abilities, confirmed across all
// 4 Types by @cypher/engine's own REQUIRED_TIER_1_COUNT constant.
export const TIER1_TYPE_ABILITY_COUNT = 4

export type StepId =
  | 'type'
  | 'descriptor'
  | 'focus'
  | 'pools'
  | 'skills'
  | 'abilities'
  | 'equipment'
  | 'background'
  | 'review'

export interface StepDef {
  id: StepId
}

export const STEPS: StepDef[] = [
  { id: 'type' },
  { id: 'descriptor' },
  { id: 'focus' },
  { id: 'pools' },
  { id: 'skills' },
  { id: 'abilities' },
  { id: 'equipment' },
  { id: 'background' },
  { id: 'review' },
]
