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
    ).toEqual({ '3': 'dual-medium-wield', '6': 'precise-cut' })
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
      advancementPurchases: [{ extraEffort: { tier: 2 } }],
    })

    expect(result).toEqual({
      type_id: 'warrior',
      descriptor_id: 'strong',
      focus_id: 'wields-two-weapons-at-once',
      starting_edge_choice: 'speed',
      pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
      descriptor_pool_bonus: { stat: 'might', amount: 4 },
      tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'improved-edge'],
      focus_choice_selections: { '3': 'dual-medium-wield' },
      advancement_purchases: [{ tier: 2, option: 'extra-effort' }],
    })
  })

  it('omits starting_edge_choice and descriptor_pool_bonus entirely when not provided', () => {
    const result = mapCharacterChoicesInput({
      typeId: 'warrior',
      descriptorId: 'strong',
      focusId: 'wields-two-weapons-at-once',
      poolPointAllocation: { might: 2, speed: 2, intellect: 2 },
      tier1TypeAbilityIds: ['bash', 'overwatch', 'swipe', 'improved-edge'],
      focusChoiceSelections: [],
      advancementPurchases: [],
    })

    expect('starting_edge_choice' in result).toBe(false)
    expect('descriptor_pool_bonus' in result).toBe(false)
  })
})
