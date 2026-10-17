import { describe, expect, it } from 'vitest'

import {
  mapAdvancementPurchase,
  mapCharacterChoicesInput,
  mapFocusChoiceSelections,
} from '../resolvers/validate/input-mapping.js'

describe('mapAdvancementPurchase', () => {
  // The @oneOf wrapper's discriminant is which field is populated, not a
  // string tag — @cypher/engine's `option` IS a kebab-case string literal,
  // and nothing in the type system catches a typo in that translation
  // (both sides are just `string`). Each case below asserts the exact
  // literal, not just that mapping succeeds, per the specific risk flagged
  // during planning.
  it('maps increasingCapabilities to the exact "increasing-capabilities" literal', () => {
    const result = mapAdvancementPurchase({
      increasingCapabilities: {
        tier: 2,
        statPoolAllocation: { might: 4, speed: 0, intellect: 0 },
      },
    })

    expect(result.option).toBe('increasing-capabilities')
    expect(result).toEqual({
      tier: 2,
      option: 'increasing-capabilities',
      stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
    })
  })

  it('maps movingTowardPerfection to the exact "moving-toward-perfection" literal', () => {
    const result = mapAdvancementPurchase({
      movingTowardPerfection: { tier: 2, edgeStat: 'might' },
    })

    expect(result.option).toBe('moving-toward-perfection')
    expect(result).toEqual({ tier: 2, option: 'moving-toward-perfection', edge_stat: 'might' })
  })

  it('maps extraEffort to the exact "extra-effort" literal', () => {
    const result = mapAdvancementPurchase({ extraEffort: { tier: 2 } })

    expect(result.option).toBe('extra-effort')
    expect(result).toEqual({ tier: 2, option: 'extra-effort' })
  })

  it('maps skills (skill target) to the exact "skills" literal with a skill-kind target', () => {
    const result = mapAdvancementPurchase({
      skills: { tier: 2, target: { skillId: 'perception' } },
    })

    expect(result.option).toBe('skills')
    expect(result).toEqual({
      tier: 2,
      option: 'skills',
      target: { kind: 'skill', skill_id: 'perception' },
    })
  })

  it('maps skills (ability target) to a target with the exact "ability" kind literal', () => {
    const result = mapAdvancementPurchase({
      skills: { tier: 3, target: { abilityId: 'bash' } },
    })

    expect(result.option).toBe('skills')
    expect(result).toEqual({
      tier: 3,
      option: 'skills',
      target: { kind: 'ability', ability_id: 'bash' },
    })
  })

  it('throws if no variant is set (defensive — @oneOf should prevent this reaching here)', () => {
    expect(() => mapAdvancementPurchase({})).toThrow()
  })
})

describe('mapFocusChoiceSelections', () => {
  it('converts a list of {tier, abilityId} pairs into a tier-string-keyed record', () => {
    expect(
      mapFocusChoiceSelections([
        { tier: 3, abilityId: 'dual-medium-wield' },
        { tier: 6, abilityId: 'precise-cut' },
      ]),
    ).toEqual({ '3': ['dual-medium-wield'], '6': ['precise-cut'] })
  })

  it('keeps every ability of a tier together, instead of collapsing to the last one', () => {
    expect(
      mapFocusChoiceSelections([
        { tier: 3, abilityId: 'a' },
        { tier: 3, abilityId: 'b' },
      ]),
    ).toEqual({ '3': ['a', 'b'] })
  })

  it('returns an empty record for an empty list', () => {
    expect(mapFocusChoiceSelections([])).toEqual({})
  })
})

describe('mapCharacterChoicesInput', () => {
  it('maps a full input, including optional fields, to the exact CharacterChoices shape', () => {
    const result = mapCharacterChoicesInput({
      typeId: 'warrior',
      descriptorId: 'strong',
      focusId: 'wields-two-weapons-at-once',
      startingEdgeChoice: 'speed',
      poolPointAllocation: { might: 2, speed: 2, intellect: 2 },
      descriptorPoolBonus: { stat: 'might', amount: 4 },
      tier1TypeAbilityIds: ['bash', 'overwatch', 'swipe', 'improved-edge'],
      focusChoiceSelections: [{ tier: 3, abilityId: 'dual-medium-wield' }],
      descriptorSkillChoices: ['perception'],
      advancementPurchases: [{ extraEffort: { tier: 2 } }],
    })

    expect(result).toEqual({
      type_id: 'warrior',
      descriptor_id: 'strong',
      focus_id: 'wields-two-weapons-at-once',
      starting_edge_choice: 'speed',
      pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
      tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'improved-edge'],
      focus_choice_selections: { '3': ['dual-medium-wield'] },
      descriptor_skill_choices: ['perception'],
      advancement_purchases: [{ tier: 2, option: 'extra-effort' }],
    })
  })

  it('ignores the deprecated descriptorPoolBonus (the engine reads it from content)', () => {
    const result = mapCharacterChoicesInput({
      typeId: 'warrior',
      descriptorId: 'strong',
      focusId: 'wields-two-weapons-at-once',
      poolPointAllocation: { might: 2, speed: 2, intellect: 2 },
      descriptorPoolBonus: { stat: 'might', amount: 20 },
      tier1TypeAbilityIds: ['bash', 'overwatch', 'swipe', 'improved-edge'],
      focusChoiceSelections: [],
      descriptorSkillChoices: [],
      advancementPurchases: [],
    })

    expect('descriptor_pool_bonus' in result).toBe(false)
  })

  it('omits starting_edge_choice entirely when not provided', () => {
    const result = mapCharacterChoicesInput({
      typeId: 'warrior',
      descriptorId: 'strong',
      focusId: 'wields-two-weapons-at-once',
      poolPointAllocation: { might: 2, speed: 2, intellect: 2 },
      tier1TypeAbilityIds: ['bash', 'overwatch', 'swipe', 'improved-edge'],
      focusChoiceSelections: [],
      descriptorSkillChoices: [],
      advancementPurchases: [],
    })

    expect('starting_edge_choice' in result).toBe(false)
  })
})

describe('mapCharacterChoicesInput (flavor)', () => {
  const base = {
    typeId: 'warrior',
    descriptorId: 'strong',
    focusId: 'wields-two-weapons-at-once',
    poolPointAllocation: { might: 2, speed: 2, intellect: 2 },
    tier1TypeAbilityIds: ['bash', 'goad', 'swipe', 'improved-edge'],
    focusChoiceSelections: [],
    descriptorSkillChoices: [],
    advancementPurchases: [],
  }

  it('maps flavorId to flavor_id', () => {
    expect(mapCharacterChoicesInput({ ...base, flavorId: 'stealth' }).flavor_id).toBe('stealth')
  })

  it('leaves flavor_id out when there is no flavor', () => {
    expect(mapCharacterChoicesInput(base)).not.toHaveProperty('flavor_id')
    expect(mapCharacterChoicesInput({ ...base, flavorId: null })).not.toHaveProperty('flavor_id')
  })
})

describe('mapCharacterChoicesInput (ability choices)', () => {
  const base = {
    typeId: 'warrior',
    descriptorId: 'strong',
    focusId: 'wields-two-weapons-at-once',
    poolPointAllocation: { might: 2, speed: 2, intellect: 2 },
    tier1TypeAbilityIds: ['bash'],
    focusChoiceSelections: [],
    descriptorSkillChoices: [],
    advancementPurchases: [],
  }

  it('maps abilityChoices to a key -> ids record', () => {
    const result = mapCharacterChoicesInput({
      ...base,
      abilityChoices: [{ key: 'type:1:blessing-of-the-gods', abilityIds: ['war', 'sky-air'] }],
    })
    expect(result.ability_choices).toEqual({ 'type:1:blessing-of-the-gods': ['war', 'sky-air'] })
  })

  it('leaves ability_choices out when there are none', () => {
    expect(mapCharacterChoicesInput(base)).not.toHaveProperty('ability_choices')
  })

  it('maps abilityEdgeChoices to a key -> stat record, and leaves it out when empty', () => {
    const result = mapCharacterChoicesInput({
      ...base,
      abilityEdgeChoices: [{ key: 'type:1:improved-edge', stat: 'intellect' }],
    })
    expect(result.ability_edge_choices).toEqual({ 'type:1:improved-edge': 'intellect' })
    expect(mapCharacterChoicesInput(base)).not.toHaveProperty('ability_edge_choices')
  })

  it('maps flavorGain to the engine’s flavor_gain, and leaves it out when absent', () => {
    const result = mapCharacterChoicesInput({
      ...base,
      flavorGain: {
        flavorId: 'stealth',
        swaps: [{ tier: 1, replaces: 'swipe', with: 'goad' }],
      },
    })
    expect(result.flavor_gain).toEqual({
      flavor_id: 'stealth',
      swaps: [{ tier: 1, replaces: 'swipe', with: 'goad' }],
    })
    expect(mapCharacterChoicesInput(base)).not.toHaveProperty('flavor_gain')
    expect(mapCharacterChoicesInput({ ...base, flavorGain: null })).not.toHaveProperty(
      'flavor_gain',
    )
  })

  it('maps learnedOptions to an ability -> options record, joining repeats', () => {
    const result = mapCharacterChoicesInput({
      ...base,
      learnedOptions: [
        { abilityId: 'cantrips', optionIds: ['bee-cantrip', 'bug-cantrip'] },
        { abilityId: 'cantrips', optionIds: ['candles-cantrip', 'chill-cantrip'] },
      ],
    })
    expect(result.learned_options).toEqual({
      cantrips: ['bee-cantrip', 'bug-cantrip', 'candles-cantrip', 'chill-cantrip'],
    })
    expect(mapCharacterChoicesInput(base)).not.toHaveProperty('learned_options')
  })
})
