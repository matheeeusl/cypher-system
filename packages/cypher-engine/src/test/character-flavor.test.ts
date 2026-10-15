import { describe, expect, it } from 'vitest'

import { resolveFlavor } from '../character/flavor.js'
import { resolveTypeAbilities, resolveTypeTierPicks } from '../character/type-abilities.js'
import type { PendingPick } from '../character/types.js'
import { CharacterRuleError } from '../errors.js'

// Shaped like content/types/warrior.yaml and content/flavors/stealth.yaml,
// trimmed to what these tests touch ('danger-sense' is in both lists on
// purpose: the Warrior doesn't have it, but Explorer-like Types do).
const warrior = {
  id: 'warrior',
  special_ability_id: null,
  tier_choose_counts: { '1': 4, '2': 2 },
  tier_abilities: {
    '1': ['bash', 'overwatch', 'swipe', 'improved-edge', 'danger-sense'],
    '2': ['bloodlust'],
  },
}

const stealth = {
  id: 'stealth',
  tier_abilities: {
    '1': ['danger-sense', 'goad', 'legerdemain'],
    '2': ['find-an-opening', 'get-away'],
    '3': ['evanesce'],
  },
}

describe('resolveFlavor', () => {
  it('is null when the character has no flavor', () => {
    expect(resolveFlavor(undefined, undefined)).toBeNull()
    expect(resolveFlavor(null, null)).toBeNull()
  })

  it('returns the flavor content when its id matches the choice', () => {
    expect(resolveFlavor('stealth', stealth)).toBe(stealth)
  })

  it('rejects a flavor id the caller supplied no (or different) content for', () => {
    for (const content of [undefined, null, { ...stealth, id: 'combat' }]) {
      try {
        resolveFlavor('stealth', content)
        expect.unreachable()
      } catch (err) {
        expect(err).toBeInstanceOf(CharacterRuleError)
        expect((err as CharacterRuleError).code).toBe('FLAVOR_UNKNOWN')
        expect((err as CharacterRuleError).params).toEqual({ flavorId: 'stealth' })
      }
    }
  })
})

describe('resolveTypeAbilities with a flavor', () => {
  it('lets tier-1 picks come from the flavor and sources them from it', () => {
    const abilities = resolveTypeAbilities(
      warrior,
      ['bash', 'goad', 'legerdemain', 'swipe'],
      stealth,
    )
    expect(abilities.map((a) => [a.ability_id, a.source.kind])).toEqual([
      ['bash', 'type'],
      ['goad', 'flavor'],
      ['legerdemain', 'flavor'],
      ['swipe', 'type'],
    ])
    expect(abilities[1]?.source).toEqual({ kind: 'flavor', flavor_id: 'stealth' })
  })

  it('still requires exactly four picks — a flavor widens the pool, not the count', () => {
    expect(() => resolveTypeAbilities(warrior, ['bash', 'goad'], stealth)).toThrow(
      CharacterRuleError,
    )
  })

  it('credits an ability both lists offer to the Type', () => {
    const [danger] = resolveTypeAbilities(
      warrior,
      ['danger-sense', 'bash', 'swipe', 'overwatch'],
      stealth,
    )
    expect(danger?.source).toEqual({ kind: 'type', type_id: 'warrior' })
  })

  it('rejects a flavor ability when the character has no flavor', () => {
    expect(() => resolveTypeAbilities(warrior, ['bash', 'goad', 'swipe', 'overwatch'])).toThrow(
      /not one of this Type's tier-1 abilities/,
    )
  })

  it("rejects a flavor's higher-tier ability as a tier-1 pick", () => {
    expect(() =>
      resolveTypeAbilities(warrior, ['bash', 'evanesce', 'swipe', 'overwatch'], stealth),
    ).toThrow(CharacterRuleError)
  })
})

describe('resolveTypeTierPicks with a flavor', () => {
  const tier1 = ['bash', 'goad', 'swipe', 'overwatch']

  it('accepts flavor abilities of the pick tier or lower, sourced from the flavor', () => {
    const pending: PendingPick[] = []
    const picks = resolveTypeTierPicks(
      warrior,
      2,
      { '2': ['get-away', 'bloodlust'] },
      tier1,
      pending,
      new Set(),
      stealth,
    )
    expect(picks.map((a) => [a.ability_id, a.source.kind])).toEqual([
      ['get-away', 'flavor'],
      ['bloodlust', 'type'],
    ])
    expect(pending).toEqual([])
  })

  it('accepts a lower-tier flavor ability at a later tier', () => {
    const picks = resolveTypeTierPicks(
      warrior,
      2,
      { '2': ['legerdemain', 'find-an-opening'] },
      ['bash', 'swipe', 'overwatch', 'improved-edge'],
      [],
      new Set(),
      stealth,
    )
    expect(picks.map((a) => a.ability_id)).toEqual(['legerdemain', 'find-an-opening'])
  })

  it('rejects a flavor ability from a tier not reached yet', () => {
    expect(() =>
      resolveTypeTierPicks(warrior, 2, { '2': ['evanesce'] }, tier1, [], new Set(), stealth),
    ).toThrow(CharacterRuleError)
  })

  it('rejects flavor abilities without a flavor', () => {
    expect(() => resolveTypeTierPicks(warrior, 2, { '2': ['get-away'] }, tier1, [])).toThrow(
      CharacterRuleError,
    )
  })

  it('does not let a flavor ability be known twice', () => {
    expect(() =>
      resolveTypeTierPicks(warrior, 2, { '2': ['goad'] }, tier1, [], new Set(), stealth),
    ).toThrow(/more than once/)
  })
})
