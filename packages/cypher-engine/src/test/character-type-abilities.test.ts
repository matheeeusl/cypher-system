import { describe, expect, it } from 'vitest'

import { resolveTypeAbilities } from '../character/type-abilities.js'

// Real data from content/types/warrior.yaml.
const warrior = {
  id: 'warrior',
  special_ability_id: null,
  tier_abilities: {
    '1': [
      'bash',
      'combat-prowess',
      'control-the-field',
      'improved-edge',
      'no-need-for-weapons',
      'overwatch',
      'physical-skills',
      'practiced-in-armor',
      'quick-throw',
      'swipe',
      'trained-without-armor',
    ],
  },
}

// Real data from content/types/adept.yaml.
const adept = {
  id: 'adept',
  special_ability_id: 'expert-cypher-use',
  tier_abilities: {
    '1': [
      'distortion',
      'erase-memories',
      'far-step',
      'hedge-magic',
      'magic-training',
      'onslaught',
      'push',
      'resonance-field',
      'scan',
      'shatter',
      'ward',
    ],
  },
}

describe('resolveTypeAbilities', () => {
  it('resolves the 4 chosen tier-1 abilities, sourced from the Type', () => {
    const abilities = resolveTypeAbilities(warrior, ['bash', 'overwatch', 'swipe', 'improved-edge'])
    expect(abilities).toEqual([
      { ability_id: 'bash', source: { kind: 'type', type_id: 'warrior' }, trained: false },
      { ability_id: 'overwatch', source: { kind: 'type', type_id: 'warrior' }, trained: false },
      { ability_id: 'swipe', source: { kind: 'type', type_id: 'warrior' }, trained: false },
      { ability_id: 'improved-edge', source: { kind: 'type', type_id: 'warrior' }, trained: false },
    ])
  })

  it('also includes the Type special_ability_id, when present (Adept)', () => {
    const abilities = resolveTypeAbilities(adept, ['distortion', 'onslaught', 'ward', 'scan'])
    expect(abilities).toHaveLength(5)
    expect(abilities.at(-1)).toEqual({
      ability_id: 'expert-cypher-use',
      source: { kind: 'type', type_id: 'adept' },
      trained: false,
    })
  })

  it('throws if fewer or more than 4 ids are chosen', () => {
    expect(() => resolveTypeAbilities(warrior, ['bash', 'overwatch'])).toThrow(/exactly 4/i)
    expect(() =>
      resolveTypeAbilities(warrior, ['bash', 'overwatch', 'swipe', 'improved-edge', 'quick-throw']),
    ).toThrow(/exactly 4/i)
  })

  it('throws on a duplicate id', () => {
    expect(() => resolveTypeAbilities(warrior, ['bash', 'bash', 'swipe', 'improved-edge'])).toThrow(
      /duplicate/i,
    )
  })

  it("throws if an id is not in the Type's tier-1 pool", () => {
    expect(() =>
      resolveTypeAbilities(warrior, ['bash', 'overwatch', 'swipe', 'onslaught']),
    ).toThrow(/not one of this Type's tier-1 abilities/)
  })
})
