// Hand-written queries + result types for exactly what the wizard needs from
// each entity — not the full schema.graphql shape. No codegen for this first
// pass: these stay in sync by hand, which is fine at this size and makes the
// wire shape visible instead of generated.

import { cachedCatalog } from './cache'
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

export const fetchTypes = cachedCatalog(async (): Promise<WizardType[]> => {
  const { types } = await gqlRequest<{ types: WizardType[] }>(TYPES_QUERY, undefined, {
    method: 'GET',
  })
  return types
})

// ---- Descriptor ----

export interface DescriptorPoolBonus {
  stat: Stat
  amount: number
}

/** A Pool bonus the player decides: points to divide, or one of a few fixed options. */
export type DescriptorPoolBonusChoice =
  | { __typename: 'DescriptorPoolDivide'; points: number; stats: Stat[] }
  | { __typename: 'DescriptorPoolOneOf'; options: DescriptorPoolBonus[][] }

export interface WizardDescriptor {
  id: string
  name: LocalizedString
  description: LocalizedString
  /** `page` is where the group starts in the book, so sorting by it gives the book's order. */
  category: { id: string; name: LocalizedString; page: number }
  // Fixed bonuses, all applied (some are negative: Clumsy's −2 Speed).
  poolBonus: DescriptorPoolBonus[]
  poolBonusChoice: DescriptorPoolBonusChoice | null
  characteristics: Array<{ name: LocalizedString; description: LocalizedString }>
  // skillId is null when this entry is a "choose N skills" slot instead of a
  // specific named skill — see choiceCount.
  // level is TRAINED except where the book starts a fixed skill higher (the
  // Elf's perception is SPECIALIZED).
  skillTraining: Array<{ skillId: string | null; choiceCount: number | null; level: SkillLevel }>
  connectionOptions: LocalizedString[]
}

const DESCRIPTORS_QUERY = `
  query Descriptors {
    descriptors {
      id
      name { en ptBR }
      description { en ptBR }
      category { id name { en ptBR } page }
      poolBonus { stat amount }
      poolBonusChoice {
        __typename
        ... on DescriptorPoolDivide { points stats }
        ... on DescriptorPoolOneOf { options { stat amount } }
      }
      characteristics { name { en ptBR } description { en ptBR } }
      skillTraining { skillId choiceCount level }
      connectionOptions { en ptBR }
    }
  }
`

export const fetchDescriptors = cachedCatalog(async (): Promise<WizardDescriptor[]> => {
  const { descriptors } = await gqlRequest<{ descriptors: WizardDescriptor[] }>(
    DESCRIPTORS_QUERY,
    undefined,
    { method: 'GET' },
  )
  return descriptors
})

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

export const fetchFoci = cachedCatalog(async (): Promise<WizardFocus[]> => {
  const { foci } = await gqlRequest<{ foci: WizardFocus[] }>(FOCI_QUERY, undefined, {
    method: 'GET',
  })
  return foci
})

// ---- Flavor ----

export interface WizardFlavor {
  id: string
  name: LocalizedString
  /** pt-BR is empty until the flavor term is decided; callers fall back to English. */
  description: LocalizedString
  tierAbilities: Array<{ tier: number; abilityIds: string[] }>
}

const FLAVORS_QUERY = `
  query Flavors {
    flavors {
      id
      name { en ptBR }
      description { en ptBR }
      tierAbilities { tier abilityIds }
    }
  }
`

export const fetchFlavors = cachedCatalog(async (): Promise<WizardFlavor[]> => {
  const { flavors } = await gqlRequest<{ flavors: WizardFlavor[] }>(FLAVORS_QUERY, undefined, {
    method: 'GET',
  })
  return flavors
})

// ---- Skill ----

export interface WizardSkill {
  id: string
  name: LocalizedString
  description: LocalizedString
  /** A fighting skill — excluded from "noncombat" skill picks. */
  combat: boolean
}

const SKILLS_QUERY = `
  query Skills {
    skills {
      id
      name { en ptBR }
      description { en ptBR }
      combat
    }
  }
`

export const fetchSkills = cachedCatalog(async (): Promise<WizardSkill[]> => {
  const { skills } = await gqlRequest<{ skills: WizardSkill[] }>(SKILLS_QUERY, undefined, {
    method: 'GET',
  })
  return skills
})

// ---- Ability ----

export interface WizardAbility {
  id: string
  name: LocalizedString
  description: LocalizedString
  cost: { pool: Stat; amount: number } | null
  /** An attack ability — the only kind the Skills advancement can train. */
  attack: boolean
  /** Set on abilities that train the character in skills they pick (Physical Skills, Life Lessons…). */
  skillGrant: {
    count: number
    mode: 'train' | 'train_or_specialize' | 'specialize'
    noncombat: boolean
    /** The player may type their own skill/area (sent as `custom:<text>`). */
    allowCustom: boolean
    /** May be taken again at a later tier ("select this ability multiple times"). */
    repeatable: boolean
    options: string[]
    /** A second shape instead of `count` picks ("or specialized in one"). */
    alternate: { count: number; mode: 'train' | 'train_or_specialize' | 'specialize' } | null
  } | null
  /** Set on abilities that ask the player to pick `count` of `options` (other abilities). */
  choice: {
    options: string[]
    count: number
    /** More options learnable later for XP (Cantrips: 2 XP for two). */
    learn: { xpCost: number; count: number } | null
  } | null
  /**
   * Set on abilities that permanently raise an Edge: 'fixed' adds `amount` to
   * `stat` (Enhanced Might Edge); 'choose_zero' (Improved Edge) raises an Edge
   * the player picks among those at 0, to 1 (`stat`/`amount` null).
   */
  edgeGrant: {
    kind: 'fixed' | 'choose_zero'
    stat: Stat | null
    amount: number | null
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
      attack
      skillGrant { count mode noncombat allowCustom repeatable options alternate { count mode } }
      choice { options count learn { xpCost count } }
      edgeGrant { kind stat amount }
    }
  }
`

export const fetchAbilities = cachedCatalog(async (): Promise<WizardAbility[]> => {
  const { abilities } = await gqlRequest<{ abilities: WizardAbility[] }>(
    ABILITIES_QUERY,
    undefined,
    { method: 'GET' },
  )
  return abilities
})

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
  flavorId?: string
  startingEdgeChoice?: Stat
  poolPointAllocation: StatAllocationInput
  /** The answer to the Descriptor's poolBonusChoice (@oneOf); only when it has one. */
  descriptorPoolChoice?: { allocation: StatAllocationInput } | { optionIndex: number }
  tier1TypeAbilityIds: string[]
  focusChoiceSelections: Array<{ tier: number; abilityId: string }>
  typeAbilityPicks?: Array<{ tier: number; abilityId: string }>
  descriptorSkillChoices: string[]
  /** Skills picked for skill-granting abilities; `key` is built by `skillGrantKey`. */
  abilitySkillChoices?: Array<{ key: string; skillIds: string[] }>
  /** Abilities picked for choice abilities (Blessing of the Gods, Cantrips); `key` as for skills. */
  abilityChoices?: Array<{ key: string; abilityIds: string[] }>
  /** Edges picked for Improved Edge; `key` as for skills. */
  abilityEdgeChoices?: Array<{ key: string; stat: Stat }>
  /** Options learned later for XP (Cantrips): the choice ability and the options bought. */
  learnedOptions?: Array<{ abilityId: string; optionIds: string[] }>
  /** A flavor gained in play (not together with `flavorId`), with its exchanges of Type abilities. */
  flavorGain?: {
    flavorId: string
    swaps: Array<{ tier: number; replaces: string; with: string }>
  }
  // Empty at character creation; play mode adds one entry per purchase, in order.
  advancementPurchases: AdvancementPurchaseInput[]
}

/** Mirrors schema.graphql's @oneOf AdvancementPurchaseInput. `tier` is the tier the purchase was made at. */
export type AdvancementPurchaseInput =
  | { increasingCapabilities: { tier: number; statPoolAllocation: StatAllocationInput } }
  | { movingTowardPerfection: { tier: number; edgeStat: Stat } }
  | { extraEffort: { tier: number } }
  | { skills: { tier: number; target: { skillId: string } | { abilityId: string } } }
  // The Other Options: at most one per tier, in place of a standard one.
  | { reduceArmorSpeedCost: { tier: number } }
  | { recoveryRollBonus: { tier: number } }
  | { typeAbility: { tier: number; abilityId: string } }
  | { focusAbility: { tier: number; abilityIds: string[] } }

export interface DerivedCharacter {
  tier: number
  pools: { might: { max: number }; speed: { max: number }; intellect: { max: number } }
  edge: { might: number; speed: number; intellect: number }
  effort: number
  /** Added to recovery rolls (1d6 + tier + this). */
  recoveryRollBonus: number
  /** Taken off the Speed Effort cost of wearing armor. */
  armorSpeedCostReduction: number
  knownAbilities: Array<{
    abilityId: string
    trained: boolean
    source:
      | { __typename: 'TypeAbilitySource'; typeId: string }
      | { __typename: 'FocusAbilitySource'; focusId: string }
      | { __typename: 'FlavorAbilitySource'; flavorId: string }
      /** Bought as an Other Option, by the purchase tagged `tier`. */
      | { __typename: 'AdvancementAbilitySource'; tier: number }
  }>
  skills: Array<{ skillId: string; level: SkillLevel }>
  /** Level-up choices still owed for tiers already reached. */
  pendingPicks: Array<{
    kind: 'type' | 'focus' | 'skill' | 'option' | 'edge'
    tier: number
    required: number
    chosen: number
    /** Only for kind 'skill' | 'option' | 'edge': the ability and the `abilitySkillChoices` / `abilityChoices` / `abilityEdgeChoices` key it is answered under. */
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
          recoveryRollBonus
          armorSpeedCostReduction
          knownAbilities {
            abilityId
            trained
            source {
              __typename
              ... on TypeAbilitySource { typeId }
              ... on FocusAbilitySource { focusId }
              ... on FlavorAbilitySource { flavorId }
              ... on AdvancementAbilitySource { tier }
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
  /** XP cost of gaining a flavor in play. */
  flavorCostXp: number
}

export const fetchAdvancementRules = cachedCatalog(async (): Promise<AdvancementRules> => {
  const { advancementRules } = await gqlRequest<{ advancementRules: AdvancementRules }>(
    'query AdvancementRules { advancementRules { costXp perTier maxTier flavorCostXp } }',
    undefined,
    { method: 'GET' },
  )
  return advancementRules
})
