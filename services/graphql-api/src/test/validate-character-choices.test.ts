import { getDescriptorById, getFocusById, getTypeById } from '@cypher/content'
import type { AdvancementPurchase, CharacterChoices } from '@cypher/engine'
import { validateCharacterChoices } from '@cypher/engine'
import { describe, expect, it } from 'vitest'

import { graphqlRequest } from './helpers.js'

// Real content, resolved the same way the resolver itself does — NOT hand-
// built literals. Unlike packages/cypher-engine's own validate-character-
// choices.test.ts (whose Focus fixture invents tiers 2-3 with a 'choice'
// entry that don't exist in the real YAML), this only relies on what's
// actually authored today: Warrior, Strong, and Wields Two Weapons at Once
// with just a tier-1 granted ability. resolveFocusAbilities tolerates a
// resolved tier higher than any tier the Focus defines (it just has nothing
// to add for tiers 2/3), so a build can still legitimately reach tier 3.
const type = getTypeById('warrior')!
const descriptor = getDescriptorById('strong')!
const focus = getFocusById('wields-two-weapons-at-once')!
const content = { type, descriptor, focus }

function completeTier(
  tier: number,
  skillsTarget: AdvancementPurchase & { option: 'skills' },
): AdvancementPurchase[] {
  return [
    {
      tier,
      option: 'increasing-capabilities',
      stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
    },
    { tier, option: 'moving-toward-perfection', edge_stat: 'might' },
    { tier, option: 'extra-effort' },
    { ...skillsTarget, tier },
  ]
}

const validChoices: CharacterChoices = {
  type_id: 'warrior',
  descriptor_id: 'strong',
  focus_id: 'wields-two-weapons-at-once',
  starting_edge_choice: 'speed',
  pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
  descriptor_pool_bonus: { stat: 'might', amount: 4 },
  tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'improved-edge'],
  focus_choice_selections: {},
  descriptor_skill_choices: [],
  advancement_purchases: [
    ...completeTier(2, {
      tier: 2,
      option: 'skills',
      target: { kind: 'skill', skill_id: 'perception' },
    }),
    ...completeTier(3, {
      tier: 3,
      option: 'skills',
      target: { kind: 'ability', ability_id: 'bash' },
    }),
  ],
}

function completeTierInput(tier: number, skillsTarget: { skillId?: string; abilityId?: string }) {
  return [
    { increasingCapabilities: { tier, statPoolAllocation: { might: 4, speed: 0, intellect: 0 } } },
    { movingTowardPerfection: { tier, edgeStat: 'MIGHT' } },
    { extraEffort: { tier } },
    { skills: { tier, target: skillsTarget } },
  ]
}

const validInput = {
  typeId: 'warrior',
  descriptorId: 'strong',
  focusId: 'wields-two-weapons-at-once',
  startingEdgeChoice: 'SPEED',
  poolPointAllocation: { might: 2, speed: 2, intellect: 2 },
  descriptorPoolBonus: { stat: 'MIGHT', amount: 4 },
  tier1TypeAbilityIds: ['bash', 'overwatch', 'swipe', 'improved-edge'],
  focusChoiceSelections: [],
  descriptorSkillChoices: [],
  advancementPurchases: [
    ...completeTierInput(2, { skillId: 'perception' }),
    ...completeTierInput(3, { abilityId: 'bash' }),
  ],
}

const VALIDATE_QUERY = `
  query ValidateCharacterChoices($input: CharacterChoicesInput!) {
    validateCharacterChoices(input: $input) {
      __typename
      ... on ValidCharacterResult {
        character {
          tier
          effort
          pools { might { max } speed { max } intellect { max } }
          edge { might speed intellect }
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
        }
      }
      ... on InvalidCharacterResult {
        errors
      }
    }
  }
`

interface ValidateQueryData {
  validateCharacterChoices: {
    __typename: 'ValidCharacterResult' | 'InvalidCharacterResult'
    character?: {
      tier: number
      effort: number
      pools: { might: { max: number }; speed: { max: number }; intellect: { max: number } }
      edge: { might: number; speed: number; intellect: number }
      knownAbilities: Array<{
        abilityId: string
        trained: boolean
        source: { __typename: string; typeId?: string; focusId?: string }
      }>
      skills: Array<{ skillId: string; level: string }>
    }
    errors?: string[]
  }
}

describe('validateCharacterChoices (valid build)', () => {
  it('returns ValidCharacterResult, matching the engine directly on tier/effort/pools/edge', async () => {
    const engineResult = validateCharacterChoices(validChoices, content)
    expect(engineResult.valid).toBe(true)
    if (!engineResult.valid) throw new Error('expected a valid engine result')

    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, { input: validInput })

    expect(result.errors).toBeUndefined()
    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('ValidCharacterResult')
    expect(payload.character).toMatchObject({
      tier: engineResult.character.tier,
      effort: engineResult.character.effort,
      pools: {
        might: { max: engineResult.character.pools.might.max },
        speed: { max: engineResult.character.pools.speed.max },
        intellect: { max: engineResult.character.pools.intellect.max },
      },
      edge: engineResult.character.edge,
    })
  })

  it('resolves known abilities with the correct source union member', async () => {
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, { input: validInput })

    const knownAbilities = result.data.validateCharacterChoices.character?.knownAbilities ?? []
    const bash = knownAbilities.find((a) => a.abilityId === 'bash')
    const dualLightWield = knownAbilities.find((a) => a.abilityId === 'dual-light-wield')

    expect(bash?.source).toEqual({ __typename: 'TypeAbilitySource', typeId: 'warrior' })
    expect(dualLightWield?.source).toEqual({
      __typename: 'FocusAbilitySource',
      focusId: 'wields-two-weapons-at-once',
    })
  })

  it('serializes SkillLevel as the SCREAMING_CASE enum name', async () => {
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, { input: validInput })

    const skills = result.data.validateCharacterChoices.character?.skills ?? []
    const perception = skills.find((s) => s.skillId === 'perception')
    expect(perception?.level).toBe('TRAINED')
  })
})

describe('validateCharacterChoices (invalid build)', () => {
  it('returns InvalidCharacterResult with the same errors the engine reports directly', async () => {
    const invalidChoices: CharacterChoices = {
      ...validChoices,
      pool_point_allocation: { might: 2, speed: 2, intellect: 1 }, // sums to 5, not 6
    }
    const engineResult = validateCharacterChoices(invalidChoices, content)
    expect(engineResult.valid).toBe(false)

    const invalidInput = {
      ...validInput,
      poolPointAllocation: { might: 2, speed: 2, intellect: 1 },
    }
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, {
      input: invalidInput,
    })

    expect(result.errors).toBeUndefined()
    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('InvalidCharacterResult')
    expect(payload.errors?.some((e) => /sum to exactly 6/.test(e))).toBe(true)
  })
})

describe('validateCharacterChoices (unresolvable content id)', () => {
  it('surfaces a top-level GraphQL error, not an InvalidCharacterResult', async () => {
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, {
      input: { ...validInput, typeId: 'nonexistent-type' },
    })

    expect(result.errors).toBeDefined()
    expect(result.errors?.[0]?.message).toMatch(/No Type found for id/)
    expect(result.data).toBeNull()
  })
})
