import { getDescriptorById, getFocusById, getTypeById } from '@cypher/content'
import type { AdvancementPurchase, CharacterChoices } from '@cypher/engine'
import { validateCharacterChoices } from '@cypher/engine'
import { describe, expect, it } from 'vitest'

import { graphqlRequest } from './helpers.js'

// Real content, resolved the same way the resolver itself does — NOT hand-
// built literals: Warrior, Strong, and Wields Two Weapons at Once. This
// Focus's tier 3 offers a real 'choice' entry (dual-medium-wield vs.
// precise-cut), so a build reaching tier 3 must supply a selection for it.
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
  tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'improved-edge'],
  focus_choice_selections: { '3': ['dual-medium-wield'] },
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
  // Deprecated and ignored; kept here to prove an older client still validates.
  descriptorPoolBonus: { stat: 'MIGHT', amount: 4 },
  tier1TypeAbilityIds: ['bash', 'overwatch', 'swipe', 'improved-edge'],
  focusChoiceSelections: [{ tier: 3, abilityId: 'dual-medium-wield' }],
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
              ... on FlavorAbilitySource { flavorId }
            }
          }
          skills { skillId level }
        }
      }
      ... on InvalidCharacterResult {
        errors
        issues { code params { key value } }
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
    issues?: Array<{ code: string; params: Array<{ key: string; value: string }> }>
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
    expect(payload.issues).toContainEqual({
      code: 'POOL_ALLOCATION_SUM',
      params: [
        { key: 'label', value: 'pool_point_allocation' },
        { key: 'expected', value: '6' },
        { key: 'actual', value: '5' },
      ],
    })
  })
})

describe('validateCharacterChoices (Descriptor Pool choice)', () => {
  // Hideous: "4 additional points to divide among your stat Pools".
  const hideous = { ...validInput, descriptorId: 'hideous' }
  const mightOf = (data: ValidateQueryData) =>
    data.validateCharacterChoices.character?.pools.might.max ?? Number.NaN

  it('adds the divided points where the player put them', async () => {
    const allMight = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, {
      input: {
        ...hideous,
        descriptorPoolChoice: { allocation: { might: 4, speed: 0, intellect: 0 } },
      },
    })
    const allIntellect = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, {
      input: {
        ...hideous,
        descriptorPoolChoice: { allocation: { might: 0, speed: 0, intellect: 4 } },
      },
    })

    expect(allMight.data.validateCharacterChoices.__typename).toBe('ValidCharacterResult')
    expect(mightOf(allMight.data) - mightOf(allIntellect.data)).toBe(4)
  })

  it('reports a missing answer as an issue', async () => {
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, { input: hideous })

    expect(result.data.validateCharacterChoices.issues).toContainEqual({
      code: 'DESCRIPTOR_POOL_CHOICE_REQUIRED',
      params: [{ key: 'kind', value: 'divide' }],
    })
  })

  it('rejects an answer with both fields set (@oneOf)', async () => {
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, {
      input: {
        ...hideous,
        descriptorPoolChoice: { allocation: { might: 4, speed: 0, intellect: 0 }, optionIndex: 0 },
      },
    })

    expect(result.errors).toBeDefined()
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

describe('validateCharacterChoices (skill-granting abilities)', () => {
  const SKILL_QUERY = `
    query ($input: CharacterChoicesInput!) {
      validateCharacterChoices(input: $input) {
        __typename
        ... on ValidCharacterResult {
          character { skills { skillId level } pendingPicks { kind tier key abilityId required chosen } }
        }
        ... on InvalidCharacterResult { issues { code params { key value } } }
      }
    }
  `
  const withPhysicalSkills = {
    ...validInput,
    tier1TypeAbilityIds: ['bash', 'overwatch', 'swipe', 'physical-skills'],
    advancementPurchases: [],
    focusChoiceSelections: [],
  }

  it('applies the picks made for a tier-1 skill-granting ability', async () => {
    const result = await graphqlRequest<{
      validateCharacterChoices: {
        __typename: string
        character?: { skills: Array<{ skillId: string; level: string }> }
      }
    }>(SKILL_QUERY, {
      input: {
        ...withPhysicalSkills,
        abilitySkillChoices: [
          { key: 'type:1:physical-skills', skillIds: ['climbing', 'swimming'] },
        ],
      },
    })

    expect(result.errors).toBeUndefined()
    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('ValidCharacterResult')
    expect(payload.character?.skills).toEqual(
      expect.arrayContaining([
        { skillId: 'climbing', level: 'TRAINED' },
        { skillId: 'swimming', level: 'TRAINED' },
      ]),
    )
  })

  it('lists missing picks as a pending skill pick', async () => {
    const result = await graphqlRequest<{
      validateCharacterChoices: {
        __typename: string
        character?: {
          pendingPicks: Array<{ kind: string; tier: number; key: string; abilityId: string }>
        }
      }
    }>(SKILL_QUERY, { input: withPhysicalSkills })

    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('ValidCharacterResult')
    expect(payload.character?.pendingPicks).toContainEqual(
      expect.objectContaining({
        kind: 'skill',
        tier: 1,
        key: 'type:1:physical-skills',
        abilityId: 'physical-skills',
      }),
    )
  })

  it('keeps a typed skill as a custom entry for abilities that allow one', async () => {
    const result = await graphqlRequest<{
      validateCharacterChoices: {
        __typename: string
        character?: { skills: Array<{ skillId: string; level: string }> }
        issues?: Array<{ code: string }>
      }
    }>(SKILL_QUERY, {
      input: {
        ...withPhysicalSkills,
        typeId: 'explorer',
        startingEdgeChoice: undefined,
        tier1TypeAbilityIds: ['block', 'endurance', 'decipher', 'knowledge-skills'],
        abilitySkillChoices: [
          { key: 'type:1:knowledge-skills', skillIds: ['custom:Archaeology', 'history'] },
        ],
      },
    })

    expect(result.errors).toBeUndefined()
    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('ValidCharacterResult')
    expect(payload.character?.skills).toContainEqual({
      skillId: 'custom:Archaeology',
      level: 'TRAINED',
    })
  })

  it('rejects a skill id that is not in the catalog as a top-level error', async () => {
    const result = await graphqlRequest(SKILL_QUERY, {
      input: {
        ...withPhysicalSkills,
        abilitySkillChoices: [{ key: 'type:1:physical-skills', skillIds: ['nope', 'climbing'] }],
      },
    })
    expect(result.errors?.[0]?.message).toMatch(/No Skill found for id "nope"/)
  })

  it('rejects a combat skill for a noncombat grant (Life Lessons)', async () => {
    const lifeLessons = {
      ...withPhysicalSkills,
      tier1TypeAbilityIds: ['bash', 'overwatch', 'swipe', 'improved-edge'],
      focusId: 'doesnt-do-much',
    }
    const ask = (skillIds: string[]) =>
      graphqlRequest<{
        validateCharacterChoices: { __typename: string; issues?: Array<{ code: string }> }
      }>(SKILL_QUERY, {
        input: {
          ...lifeLessons,
          abilitySkillChoices: [{ key: 'focus:1:life-lessons', skillIds }],
        },
      })

    const combat = await ask(['might-defense', 'perception'])
    expect(combat.data.validateCharacterChoices.issues?.map((i) => i.code)).toContain(
      'ABILITY_SKILL_CHOICE_INVALID',
    )
    const fine = await ask(['history', 'perception'])
    expect(fine.data.validateCharacterChoices.__typename).toBe('ValidCharacterResult')
  })

  it('exposes the grant on Ability.skillGrant', async () => {
    const result = await graphqlRequest<{
      physical: { skillGrant: { count: number; noncombat: boolean; options: string[] } | null }
      lessons: { skillGrant: { count: number; noncombat: boolean; options: string[] } | null }
      bash: { skillGrant: null }
      mastery: { skillGrant: { count: number; mode: string; options: string[] } | null }
      learned: {
        skillGrant: {
          count: number
          noncombat: boolean
          allowCustom: boolean
          alternate: { count: number; mode: string } | null
        } | null
      }
    }>(`{
      mastery: ability(id: "mastery-with-defense") { skillGrant { count mode options } }
      learned: ability(id: "learned-a-few-things") {
        skillGrant { count noncombat allowCustom alternate { count mode } }
      }
      physical: ability(id: "physical-skills") { skillGrant { count noncombat options } }
      lessons: ability(id: "life-lessons") { skillGrant { count noncombat options } }
      bash: ability(id: "bash") { skillGrant { count } }
    }`)
    expect(result.errors).toBeUndefined()
    expect(result.data.physical.skillGrant?.count).toBe(2)
    expect(result.data.physical.skillGrant?.options).toContain('climbing')
    expect(result.data.lessons.skillGrant).toEqual({ count: 2, noncombat: true, options: [] })
    expect(result.data.bash.skillGrant).toBeNull()
    expect(result.data.learned.skillGrant).toEqual({
      count: 2,
      noncombat: true,
      allowCustom: true,
      alternate: { count: 1, mode: 'specialize' },
    })
    expect(result.data.mastery.skillGrant).toEqual({
      count: 1,
      mode: 'specialize',
      options: ['might-defense', 'speed-defense', 'intellect-defense'],
    })
  })
})

describe('validateCharacterChoices (flavor)', () => {
  // Warrior has no Goad; the Stealth flavor does, at tier 1.
  const flavoredInput = {
    ...validInput,
    flavorId: 'stealth',
    tier1TypeAbilityIds: ['bash', 'goad', 'swipe', 'improved-edge'],
  }

  it('accepts a flavor ability as a tier-1 pick and reports the flavor as its source', async () => {
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, {
      input: flavoredInput,
    })

    expect(result.errors).toBeUndefined()
    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('ValidCharacterResult')
    const goad = payload.character?.knownAbilities.find((a) => a.abilityId === 'goad')
    expect(goad?.source).toEqual({ __typename: 'FlavorAbilitySource', flavorId: 'stealth' })
  })

  it('rejects the same pick without a flavor, as an ordinary rule error', async () => {
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, {
      input: { ...flavoredInput, flavorId: null },
    })

    expect(result.errors).toBeUndefined()
    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('InvalidCharacterResult')
    expect(payload.issues?.map((i) => i.code)).toContain('TYPE_ABILITY_UNAVAILABLE')
  })

  it('trains the skills picked for a skill-granting flavor ability, keyed like a Type pick', async () => {
    const query = `
      query ($input: CharacterChoicesInput!) {
        validateCharacterChoices(input: $input) {
          __typename
          ... on ValidCharacterResult {
            character {
              skills { skillId level }
              pendingPicks { kind key }
            }
          }
        }
      }
    `
    const result = await graphqlRequest<{
      validateCharacterChoices: {
        __typename: string
        character?: {
          skills: Array<{ skillId: string; level: string }>
          pendingPicks: Array<{ kind: string; key: string | null }>
        }
      }
    }>(query, {
      input: {
        ...validInput,
        flavorId: 'skills-and-knowledge',
        tier1TypeAbilityIds: ['bash', 'interaction-skills', 'swipe', 'improved-edge'],
        // Skill picks of a flavor ability use the `type:` kind: the pick lives in the Type's list.
        abilitySkillChoices: [
          { key: 'type:1:interaction-skills', skillIds: ['persuasion', 'public-speaking'] },
        ],
      },
    })

    expect(result.errors).toBeUndefined()
    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('ValidCharacterResult')
    // validInput reaches tier 3, so Type picks are owed; the skill picks are all answered.
    expect(payload.character?.pendingPicks.filter((pick) => pick.kind === 'skill')).toEqual([])
    const trained = payload.character?.skills
      .filter((s) => s.level === 'TRAINED')
      .map((s) => s.skillId)
    expect(trained).toEqual(expect.arrayContaining(['persuasion', 'public-speaking']))
  })

  describe('choice abilities (Blessing of the Gods)', () => {
    const QUERY = `
      query ($input: CharacterChoicesInput!) {
        validateCharacterChoices(input: $input) {
          __typename
          ... on ValidCharacterResult {
            character {
              knownAbilities { abilityId source { __typename ... on FlavorAbilitySource { flavorId } } }
              pendingPicks { kind key abilityId required chosen }
            }
          }
          ... on InvalidCharacterResult { issues { code params { key value } } }
        }
      }
    `
    interface Payload {
      validateCharacterChoices: {
        __typename: string
        character?: {
          knownAbilities: Array<{
            abilityId: string
            source: { __typename: string; flavorId?: string }
          }>
          pendingPicks: Array<{
            kind: string
            key: string | null
            abilityId: string | null
            required: number
            chosen: number
          }>
        }
        issues?: Array<{ code: string }>
      }
    }
    const blessed = {
      ...validInput,
      flavorId: 'magic',
      tier1TypeAbilityIds: ['bash', 'blessing-of-the-gods', 'swipe', 'improved-edge'],
    }

    it('adds the blessings picked, credited to the flavor', async () => {
      const result = await graphqlRequest<Payload>(QUERY, {
        input: {
          ...blessed,
          abilityChoices: [{ key: 'type:1:blessing-of-the-gods', abilityIds: ['war', 'sky-air'] }],
        },
      })
      expect(result.errors).toBeUndefined()
      const payload = result.data.validateCharacterChoices
      expect(payload.__typename).toBe('ValidCharacterResult')
      const war = payload.character?.knownAbilities.find((a) => a.abilityId === 'war')
      expect(war?.source).toEqual({ __typename: 'FlavorAbilitySource', flavorId: 'magic' })
      expect(payload.character?.pendingPicks.filter((p) => p.kind === 'option')).toEqual([])
    })

    it('owes the picks as a pending "option" choice with the key to answer under', async () => {
      const result = await graphqlRequest<Payload>(QUERY, { input: blessed })
      const pending = result.data.validateCharacterChoices.character?.pendingPicks.filter(
        (p) => p.kind === 'option',
      )
      expect(pending).toEqual([
        {
          kind: 'option',
          key: 'type:1:blessing-of-the-gods',
          abilityId: 'blessing-of-the-gods',
          required: 2,
          chosen: 0,
        },
      ])
    })

    it('rejects an option the ability does not offer', async () => {
      const result = await graphqlRequest<Payload>(QUERY, {
        input: {
          ...blessed,
          abilityChoices: [{ key: 'type:1:blessing-of-the-gods', abilityIds: ['war', 'bash'] }],
        },
      })
      const payload = result.data.validateCharacterChoices
      expect(payload.__typename).toBe('InvalidCharacterResult')
      expect(payload.issues?.map((i) => i.code)).toContain('ABILITY_CHOICE_INVALID')
    })

    describe('options learned for XP', () => {
      const modern = {
        ...validInput,
        flavorId: 'modern-magic',
        tier1TypeAbilityIds: ['bash', 'cantrips', 'swipe', 'improved-edge'],
        abilityChoices: [
          {
            key: 'type:1:cantrips',
            abilityIds: ['bee-cantrip', 'bug-cantrip', 'candles-cantrip', 'chill-cantrip'],
          },
        ],
      }
      const learn = (optionIds: string[]) => [{ abilityId: 'cantrips', optionIds }]

      it('adds the learned cantrips, credited to the flavor', async () => {
        const result = await graphqlRequest<Payload>(QUERY, {
          input: { ...modern, learnedOptions: learn(['clean-cantrip', 'color-cantrip']) },
        })
        expect(result.errors).toBeUndefined()
        const payload = result.data.validateCharacterChoices
        expect(payload.__typename).toBe('ValidCharacterResult')
        const clean = payload.character?.knownAbilities.find((a) => a.abilityId === 'clean-cantrip')
        expect(clean?.source).toEqual({
          __typename: 'FlavorAbilitySource',
          flavorId: 'modern-magic',
        })
      })

      it('refuses to learn without the Modern Magic flavor', async () => {
        const result = await graphqlRequest<Payload>(QUERY, {
          input: {
            ...validInput,
            flavorId: 'magic',
            learnedOptions: learn(['clean-cantrip', 'color-cantrip']),
          },
        })
        const payload = result.data.validateCharacterChoices
        expect(payload.__typename).toBe('InvalidCharacterResult')
        expect(payload.issues?.map((i) => i.code)).toContain('LEARN_NOT_AVAILABLE')
      })

      it('refuses a half purchase', async () => {
        const result = await graphqlRequest<Payload>(QUERY, {
          input: { ...modern, learnedOptions: learn(['clean-cantrip']) },
        })
        expect(result.data.validateCharacterChoices.issues?.map((i) => i.code)).toContain(
          'LEARN_COUNT',
        )
      })
    })
  })

  describe('a flavor gained in play', () => {
    const QUERY = `
      query ($input: CharacterChoicesInput!) {
        validateCharacterChoices(input: $input) {
          __typename
          ... on ValidCharacterResult {
            character {
              knownAbilities { abilityId source { __typename ... on FlavorAbilitySource { flavorId } } }
            }
          }
          ... on InvalidCharacterResult { issues { code params { key value } } }
        }
      }
    `
    interface Payload {
      validateCharacterChoices: {
        __typename: string
        character?: {
          knownAbilities: Array<{
            abilityId: string
            source: { __typename: string; flavorId?: string }
          }>
        }
        issues?: Array<{ code: string; params: Array<{ key: string; value: string }> }>
      }
    }
    const gain = (swaps: Array<{ tier: number; replaces: string; with: string }>) => ({
      ...validInput,
      flavorGain: { flavorId: 'stealth', swaps },
    })

    it('swaps a pick for a flavor ability, credited to the flavor', async () => {
      const result = await graphqlRequest<Payload>(QUERY, {
        input: gain([{ tier: 1, replaces: 'swipe', with: 'goad' }]),
      })
      expect(result.errors).toBeUndefined()
      const payload = result.data.validateCharacterChoices
      expect(payload.__typename).toBe('ValidCharacterResult')
      const known = payload.character?.knownAbilities ?? []
      expect(known.find((a) => a.abilityId === 'goad')?.source).toEqual({
        __typename: 'FlavorAbilitySource',
        flavorId: 'stealth',
      })
      expect(known.map((a) => a.abilityId)).not.toContain('swipe')
    })

    it('reports a bad exchange with its code and params', async () => {
      const result = await graphqlRequest<Payload>(QUERY, {
        input: gain([{ tier: 1, replaces: 'swipe', with: 'not-a-flavor-ability' }]),
      })
      const payload = result.data.validateCharacterChoices
      expect(payload.__typename).toBe('InvalidCharacterResult')
      expect(payload.issues).toContainEqual({
        code: 'FLAVOR_SWAP_WITH_INVALID',
        params: [
          { key: 'tier', value: '1' },
          { key: 'replaces', value: 'swipe' },
          { key: 'with', value: 'not-a-flavor-ability' },
        ],
      })
    })

    it('surfaces an unknown gained flavor id as a top-level GraphQL error', async () => {
      const result = await graphqlRequest<Payload>(QUERY, {
        input: { ...validInput, flavorGain: { flavorId: 'nonexistent-flavor', swaps: [] } },
      })
      expect(result.errors?.[0]?.message).toMatch(/No Flavor found for id/)
    })
  })

  it('surfaces an unknown flavor id as a top-level GraphQL error', async () => {
    const result = await graphqlRequest<ValidateQueryData>(VALIDATE_QUERY, {
      input: { ...flavoredInput, flavorId: 'nonexistent-flavor' },
    })

    expect(result.errors?.[0]?.message).toMatch(/No Flavor found for id/)
    expect(result.data).toBeNull()
  })
})

// validInput is a Warrior with Speed as starting Edge and Improved Edge at tier 1.
describe('validateCharacterChoices (Improved Edge)', () => {
  const EDGE_QUERY = `
    query ($input: CharacterChoicesInput!) {
      validateCharacterChoices(input: $input) {
        __typename
        ... on ValidCharacterResult {
          character {
            edge { might speed intellect }
            pendingPicks { kind tier key abilityId required chosen }
          }
        }
        ... on InvalidCharacterResult { issues { code } }
      }
    }
  `
  interface Payload {
    validateCharacterChoices: {
      __typename: string
      character?: {
        edge: { might: number; speed: number; intellect: number }
        pendingPicks: Array<{ kind: string; key: string | null; abilityId: string | null }>
      }
      issues?: Array<{ code: string }>
    }
  }
  const edgePicks = (pending: Array<{ kind: string }> = []) =>
    pending.filter((pick) => pick.kind === 'edge')

  it('owes the Edge as a pending "edge" pick with the key to answer under', async () => {
    const result = await graphqlRequest<Payload>(EDGE_QUERY, { input: validInput })
    expect(result.errors).toBeUndefined()
    expect(edgePicks(result.data.validateCharacterChoices.character?.pendingPicks)).toEqual([
      {
        kind: 'edge',
        tier: 1,
        key: 'type:1:improved-edge',
        abilityId: 'improved-edge',
        required: 1,
        chosen: 0,
      },
    ])
  })

  it('raises the picked Edge and clears the pending pick', async () => {
    const before = await graphqlRequest<Payload>(EDGE_QUERY, { input: validInput })
    const result = await graphqlRequest<Payload>(EDGE_QUERY, {
      input: {
        ...validInput,
        abilityEdgeChoices: [{ key: 'type:1:improved-edge', stat: 'INTELLECT' }],
      },
    })
    const character = result.data.validateCharacterChoices.character
    expect(character?.edge.intellect).toBe(
      (before.data.validateCharacterChoices.character?.edge.intellect ?? NaN) + 1,
    )
    expect(edgePicks(character?.pendingPicks)).toEqual([])
  })

  it('rejects the starting Edge stat, which is not 0', async () => {
    const result = await graphqlRequest<Payload>(EDGE_QUERY, {
      input: {
        ...validInput,
        abilityEdgeChoices: [{ key: 'type:1:improved-edge', stat: 'SPEED' }],
      },
    })
    const payload = result.data.validateCharacterChoices
    expect(payload.__typename).toBe('InvalidCharacterResult')
    expect(payload.issues?.map((i) => i.code)).toEqual(['EDGE_CHOICE_NOT_ZERO'])
  })
})

describe('validateCharacterChoices (Other Options)', () => {
  const QUERY = `
    query Validate($input: CharacterChoicesInput!) {
      validateCharacterChoices(input: $input) {
        __typename
        ... on ValidCharacterResult {
          character {
            tier
            recoveryRollBonus
            armorSpeedCostReduction
            knownAbilities {
              abilityId
              source {
                __typename
                ... on AdvancementAbilitySource { tier }
              }
            }
          }
        }
        ... on InvalidCharacterResult { issues { code } }
      }
    }
  `
  interface Data {
    validateCharacterChoices: {
      __typename: string
      character?: {
        tier: number
        recoveryRollBonus: number
        armorSpeedCostReduction: number
        knownAbilities: Array<{ abilityId: string; source: { __typename: string; tier?: number } }>
      }
      issues?: Array<{ code: string }>
    }
  }

  const threeStandard = (tier: number) => completeTierInput(tier, {}).slice(0, 3)

  it('takes one Other Option per tier in place of a standard advancement', async () => {
    const input = {
      ...validInput,
      advancementPurchases: [
        ...threeStandard(2),
        { typeAbility: { tier: 2, abilityId: 'quick-throw' } },
        ...threeStandard(3),
        { recoveryRollBonus: { tier: 3 } },
        { focusAbility: { tier: 4, abilityIds: ['precise-cut'] } },
      ],
    }
    const result = await graphqlRequest<Data>(QUERY, { input })
    expect(result.errors).toBeUndefined()
    const character = result.data.validateCharacterChoices.character!
    expect(character.tier).toBe(3)
    expect(character.recoveryRollBonus).toBe(2)
    expect(character.armorSpeedCostReduction).toBe(0)
    const bought = character.knownAbilities.filter(
      (a) => a.source.__typename === 'AdvancementAbilitySource',
    )
    expect(bought).toEqual([
      { abilityId: 'quick-throw', source: { __typename: 'AdvancementAbilitySource', tier: 2 } },
      { abilityId: 'precise-cut', source: { __typename: 'AdvancementAbilitySource', tier: 4 } },
    ])
  })

  it('reports two Other Options in one tier by code', async () => {
    const input = {
      ...validInput,
      advancementPurchases: [
        ...threeStandard(2).slice(0, 2),
        { recoveryRollBonus: { tier: 2 } },
        { reduceArmorSpeedCost: { tier: 2 } },
      ],
    }
    const result = await graphqlRequest<Data>(QUERY, { input })
    expect(result.data.validateCharacterChoices.issues?.map((i) => i.code)).toContain(
      'TIER_OTHER_REPEATED',
    )
  })
})
