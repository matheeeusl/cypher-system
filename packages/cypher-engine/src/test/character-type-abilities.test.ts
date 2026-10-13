import { describe, expect, it } from 'vitest'

import { resolveTypeAbilities, resolveTypeTierPicks } from '../character/type-abilities.js'
import type { PendingPick } from '../character/types.js'

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

describe('resolveTypeTierPicks', () => {
  const type = {
    id: 'warrior',
    tier_abilities: { '1': ['a', 'b', 'c', 'd', 'e'], '2': ['f', 'g'], '3': ['h'] },
    tier_choose_counts: { '1': 4, '2': 2, '3': 3 },
  }
  const known = ['a', 'b', 'c', 'd']

  it('grants nothing at tier 1', () => {
    const pending: PendingPick[] = []
    expect(resolveTypeTierPicks(type, 1, {}, known, pending)).toEqual([])
    expect(pending).toEqual([])
  })

  it('reports unmade picks for each reached tier as pending', () => {
    const pending: PendingPick[] = []
    resolveTypeTierPicks(type, 3, { '2': ['f'] }, known, pending)
    expect(pending).toEqual([
      { kind: 'type', tier: 2, required: 2, chosen: 1 },
      { kind: 'type', tier: 3, required: 3, chosen: 0 },
    ])
  })

  it('lets a pick come from the tier or any lower one', () => {
    const picks = resolveTypeTierPicks(type, 2, { '2': ['e', 'g'] }, known, [])
    expect(picks.map((p) => p.ability_id)).toEqual(['e', 'g'])
    expect(picks[0]?.source).toEqual({ kind: 'type', type_id: 'warrior' })
  })

  it('rejects abilities from a higher tier, duplicates, too many, and unreached tiers', () => {
    const run = (picks: Record<string, string[]>, tier = 2) =>
      resolveTypeTierPicks(type, tier, picks, known, [])
    expect(() => run({ '2': ['h'] })).toThrow(/at or below tier 2/)
    expect(() => run({ '2': ['a'] })).toThrow(/more than once/)
    expect(() => run({ '2': ['f', 'f'] })).toThrow(/more than once/)
    expect(() => run({ '2': ['e', 'f', 'g'] })).toThrow(/more were supplied/)
    expect(() => run({ '3': ['h'] })).toThrow(/not reached yet/)
  })
})
