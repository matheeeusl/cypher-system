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
  // One entry per tier-1 ChoiceAbility on the selected Focus, in the same
  // order focusTier1ChoiceEntries() returns them. Each inner array holds
  // the *option-bundle indices* currently picked for that entry (into that
  // entry's own `options` list) — length must reach entry.count to be
  // valid; almost always 0 or 1 items long, but Channels Divine Blessings
  // needs 2 (pick-2-of-13).
  focusChoiceSelections: number[][]
  poolAllocation: PoolAllocation
  tier1TypeAbilityIds: string[]
  name: string
  background: string
}

export const INITIAL_CHOICES: WizardChoices = {
  typeId: null,
  startingEdgeChoice: null,
  descriptorId: null,
  descriptorSkillChoices: [],
  focusId: null,
  focusChoiceSelections: [],
  poolAllocation: { might: 0, speed: 0, intellect: 0 },
  tier1TypeAbilityIds: [],
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
  label: string
  title: string
  blurb?: string
}

export const STEPS: StepDef[] = [
  {
    id: 'type',
    label: 'Type',
    title: 'Choose Your Type',
    blurb:
      'The noun of "I am an adjective noun who verbs." Your Type is the core of your character — in some other games, it might be called your character class.',
  },
  {
    id: 'descriptor',
    label: 'Descriptor',
    title: 'Choose Your Descriptor',
    blurb:
      'The adjective of "I am an adjective noun who verbs." Your Descriptor defines your character — it colors everything you do.',
  },
  {
    id: 'focus',
    label: 'Focus',
    title: 'Choose Your Focus',
    blurb:
      'The verb of "I am an adjective noun who verbs." Focus is what your character does best — it gives them specificity and interesting new abilities.',
  },
  { id: 'pools', label: 'Pools', title: 'Allocate Stat Pools' },
  { id: 'skills', label: 'Skills', title: 'Choose Trained Skills' },
  { id: 'abilities', label: 'Abilities', title: 'Choose Tier-1 Abilities' },
  { id: 'equipment', label: 'Equipment', title: 'Starting Equipment' },
  { id: 'background', label: 'Background', title: 'Name & Background' },
  { id: 'review', label: 'Review', title: 'Review Your Character' },
]
