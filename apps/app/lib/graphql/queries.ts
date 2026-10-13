// Hand-written queries + result types for exactly what the wizard needs from
// each entity — not the full schema.graphql shape. No codegen for this first
// pass: these stay in sync by hand, which is fine at this size and makes the
// wire shape visible instead of generated.

import { gqlRequest } from './client'

export interface LocalizedString {
  en: string
  ptBR: string
}

export type Stat = 'MIGHT' | 'SPEED' | 'INTELLECT'
export type PriceTier =
  'INEXPENSIVE' | 'MODERATELY_PRICED' | 'EXPENSIVE' | 'VERY_EXPENSIVE' | 'EXORBITANT' | 'PRICELESS'
export type ActionType =
  'ACTION' | 'ENABLER' | 'ACTION_TO_INITIATE' | 'ACTION_TO_INITIATE_OR_REINITIATE'
export type SkillLevel = 'INABILITY' | 'PRACTICED' | 'TRAINED' | 'SPECIALIZED'

// ---- Type ----

export interface WizardType {
  id: string
  name: LocalizedString
  tagline: LocalizedString
  startingPools: { might: number; speed: number; intellect: number }
  startingEdge: { statChoices: Stat[]; amount: number }
  cypherLimit: number
  tierAbilities: Array<{ tier: number; abilityIds: string[] }>
  tierChooseCounts: Array<{ tier: number; count: number }>
  startingEquipment: {
    clothing: boolean
    weapon: LocalizedString | null
    items: Array<{ priceTier: PriceTier; count: number; exact: boolean }>
  }
}

const TYPES_QUERY = `
  query Types {
    types {
      id
      name { en ptBR }
      tagline { en ptBR }
      startingPools { might speed intellect }
      startingEdge { statChoices amount }
      cypherLimit
      tierAbilities { tier abilityIds }
      tierChooseCounts { tier count }
      startingEquipment {
        clothing
        weapon { en ptBR }
        items { priceTier count exact }
      }
    }
  }
`

export async function fetchTypes(): Promise<WizardType[]> {
  const { types } = await gqlRequest<{ types: WizardType[] }>(TYPES_QUERY)
  return types
}

// ---- Descriptor ----

export interface WizardDescriptor {
  id: string
  name: LocalizedString
  description: LocalizedString
  poolBonus: Array<{ stat: Stat; amount: number }>
  characteristics: Array<{ name: LocalizedString; description: LocalizedString }>
  // skillId is null when this entry is a "choose N skills" slot instead of a
  // specific named skill — see choiceCount.
  skillTraining: Array<{ skillId: string | null; choiceCount: number | null }>
  connectionOptions: LocalizedString[]
}

const DESCRIPTORS_QUERY = `
  query Descriptors {
    descriptors {
      id
      name { en ptBR }
      description { en ptBR }
      poolBonus { stat amount }
      characteristics { name { en ptBR } description { en ptBR } }
      skillTraining { skillId choiceCount }
      connectionOptions { en ptBR }
    }
  }
`

export async function fetchDescriptors(): Promise<WizardDescriptor[]> {
  const { descriptors } = await gqlRequest<{ descriptors: WizardDescriptor[] }>(DESCRIPTORS_QUERY)
  return descriptors
}

// ---- Focus ----

export type FocusTierAbilityEntry =
  | { __typename: 'GrantedAbility'; abilityId: string }
  // Each entry in `options` is a list: usually 1 ability id, but a few Foci
  // offer a "choose either X, or both Y and Z" bundled-pair option, which
  // is a 2-element list. `count` is how many *options* (not total ability
  // ids) to pick.
  | { __typename: 'ChoiceAbility'; options: string[][]; count: number }

export interface WizardFocus {
  id: string
  name: LocalizedString
  description: LocalizedString
  tierAbilities: Array<{ tier: number; entries: FocusTierAbilityEntry[] }>
}

const FOCI_QUERY = `
  query Foci {
    foci {
      id
      name { en ptBR }
      description { en ptBR }
      tierAbilities {
        tier
        entries {
          __typename
          ... on GrantedAbility { abilityId }
          ... on ChoiceAbility { options count }
        }
      }
    }
  }
`

export async function fetchFoci(): Promise<WizardFocus[]> {
  const { foci } = await gqlRequest<{ foci: WizardFocus[] }>(FOCI_QUERY)
  return foci
}

// ---- Skill ----

export interface WizardSkill {
  id: string
  name: LocalizedString
  /** A fighting skill — excluded from "noncombat" skill picks. */
  combat: boolean
}

const SKILLS_QUERY = `
  query Skills {
    skills {
      id
      name { en ptBR }
      combat
    }
  }
`

export async function fetchSkills(): Promise<WizardSkill[]> {
  const { skills } = await gqlRequest<{ skills: WizardSkill[] }>(SKILLS_QUERY)
  return skills
}

// ---- Ability ----

export interface WizardAbility {
  id: string
  name: LocalizedString
  description: LocalizedString
  cost: { pool: Stat; amount: number } | null
  /** Set on abilities that train the character in skills they pick (Physical Skills, Life Lessons…). */
  skillGrant: {
    count: number
    mode: 'train' | 'train_or_specialize' | 'specialize'
    noncombat: boolean
    /** The player may type their own skill/area (sent as `custom:<text>`). */
    allowCustom: boolean
    options: string[]
    /** A second shape instead of `count` picks ("or specialized in one"). */
    alternate: { count: number; mode: 'train' | 'train_or_specialize' | 'specialize' } | null
  } | null
  // actionType deliberately not fetched: the wizard doesn't display it, and
  // schema.graphql's ActionType enum only covers 4 of the ~28 action-type
  // values real Ability content actually uses — requesting it crashes the
  // whole query the moment any ability has one of the other ~24. Content
  // schema: packages/content/src/schemas/ability.ts's action_type enum.
}

const ABILITIES_QUERY = `
  query Abilities {
    abilities {
      id
      name { en ptBR }
      description { en ptBR }
      cost { pool amount }
      skillGrant { count mode noncombat allowCustom options alternate { count mode } }
    }
  }
`

export async function fetchAbilities(): Promise<WizardAbility[]> {
  const { abilities } = await gqlRequest<{ abilities: WizardAbility[] }>(ABILITIES_QUERY)
  return abilities
}

// ---- validateCharacterChoices ----

export interface StatAllocationInput {
  might: number
  speed: number
  intellect: number
}

export interface CharacterChoicesInput {
  typeId: string
  descriptorId: string
  focusId: string
  startingEdgeChoice?: Stat
  poolPointAllocation: StatAllocationInput
  descriptorPoolBonus?: { stat: Stat; amount: number }
  tier1TypeAbilityIds: string[]
  focusChoiceSelections: Array<{ tier: number; abilityId: string }>
  typeAbilityPicks?: Array<{ tier: number; abilityId: string }>
  descriptorSkillChoices: string[]
  /** Skills picked for skill-granting abilities; `key` is built by `skillGrantKey`. */
  abilitySkillChoices?: Array<{ key: string; skillIds: string[] }>
  // Empty at character creation; play mode adds one entry per purchase, in order.
  advancementPurchases: AdvancementPurchaseInput[]
}

/** Mirrors schema.graphql's @oneOf AdvancementPurchaseInput. `tier` is the tier the purchase was made at. */
export type AdvancementPurchaseInput =
  | { increasingCapabilities: { tier: number; statPoolAllocation: StatAllocationInput } }
  | { movingTowardPerfection: { tier: number; edgeStat: Stat } }
  | { extraEffort: { tier: number } }
  | { skills: { tier: number; target: { skillId: string } | { abilityId: string } } }

export interface DerivedCharacter {
  tier: number
  pools: { might: { max: number }; speed: { max: number }; intellect: { max: number } }
  edge: { might: number; speed: number; intellect: number }
  effort: number
  knownAbilities: Array<{
    abilityId: string
    trained: boolean
    source:
      | { __typename: 'TypeAbilitySource'; typeId: string }
      | { __typename: 'FocusAbilitySource'; focusId: string }
  }>
  skills: Array<{ skillId: string; level: SkillLevel }>
  /** Level-up choices still owed for tiers already reached. */
  pendingPicks: Array<{
    kind: 'type' | 'focus' | 'skill'
    tier: number
    required: number
    chosen: number
    /** Only for kind 'skill': the ability and the `abilitySkillChoices` key it is answered under. */
    key: string | null
    abilityId: string | null
    alternateRequired: number | null
  }>
}

export interface ValidationIssueData {
  code: string
  params: Array<{ key: string; value: string }>
}

export type ValidationResult =
  | { __typename: 'ValidCharacterResult'; character: DerivedCharacter }
  // `errors` are English; `issues` (same order) carry a code + params to localize.
  | { __typename: 'InvalidCharacterResult'; errors: string[]; issues: ValidationIssueData[] }

const VALIDATE_CHARACTER_CHOICES_QUERY = `
  query ValidateCharacterChoices($input: CharacterChoicesInput!) {
    validateCharacterChoices(input: $input) {
      __typename
      ... on ValidCharacterResult {
        character {
          tier
          pools { might { max } speed { max } intellect { max } }
          edge { might speed intellect }
          effort
          knownAbilities {
            abilityId
            trained
            source {
              __typename
              ... on TypeAbilitySource { typeId }
              ... on FocusAbilitySource { focusId }
            }
          }
          skills { skillId level }
          pendingPicks { kind tier required chosen key abilityId alternateRequired }
        }
      }
      ... on InvalidCharacterResult {
        errors
        issues { code params { key value } }
      }
    }
  }
`

export async function validateCharacterChoices(
  input: CharacterChoicesInput,
): Promise<ValidationResult> {
  const { validateCharacterChoices: result } = await gqlRequest<
    { validateCharacterChoices: ValidationResult },
    { input: CharacterChoicesInput }
  >(VALIDATE_CHARACTER_CHOICES_QUERY, { input })
  return result
}

// ---- advancement rules ----

export interface AdvancementRules {
  costXp: number
  perTier: number
  maxTier: number
}

export async function fetchAdvancementRules(): Promise<AdvancementRules> {
  const { advancementRules } = await gqlRequest<{ advancementRules: AdvancementRules }>(
    'query AdvancementRules { advancementRules { costXp perTier maxTier } }',
  )
  return advancementRules
}
