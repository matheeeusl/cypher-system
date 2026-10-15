import { describe, expect, it } from 'vitest'

import { resolveLearnedOptions } from '../character/learned-options.js'
import type { KnownAbility } from '../character/types.js'
import { CharacterRuleError } from '../errors.js'

// Shaped like content/abilities/cantrips.yaml (trimmed): learning brings 2 more options.
const defs = {
  cantrips: { options: ['a', 'b', 'c', 'd', 'e', 'f'], count: 4, learn: { xp_cost: 2, count: 2 } },
  blessing: { options: ['war', 'sky'], count: 1 },
}
const modernMagic = { id: 'modern-magic', tier_abilities: { '1': ['cantrips'] } }
const combat = { id: 'combat', tier_abilities: { '1': ['bash'] } }
const flavorSource = { kind: 'flavor', flavor_id: 'modern-magic' } as const
const known = (...ids: string[]): KnownAbility[] =>
  ids.map((ability_id) => ({ ability_id, source: flavorSource, trained: false }))

const code = (fn: () => unknown) => {
  try {
    fn()
  } catch (error) {
    return error instanceof CharacterRuleError ? error.code : 'other'
  }
  return null
}

describe('resolveLearnedOptions', () => {
  it('turns the learned options into known abilities credited to the flavor', () => {
    expect(
      resolveLearnedOptions(modernMagic, defs, { cantrips: ['e', 'f'] }, known('cantrips', 'a')),
    ).toEqual([
      { ability_id: 'e', source: flavorSource, trained: false },
      { ability_id: 'f', source: flavorSource, trained: false },
    ])
  })

  it('accepts more than one purchase, in multiples of the learn count', () => {
    expect(
      resolveLearnedOptions(modernMagic, defs, { cantrips: ['b', 'c', 'e', 'f'] }, known('a', 'd')),
    ).toHaveLength(4)
  })

  it('returns nothing when nothing was learned', () => {
    expect(resolveLearnedOptions(null, defs, {}, [])).toEqual([])
    expect(resolveLearnedOptions(modernMagic, defs, { cantrips: [] }, [])).toEqual([])
  })

  it('is not available without a flavor that lists the ability', () => {
    const learned = { cantrips: ['e', 'f'] }
    expect(code(() => resolveLearnedOptions(null, defs, learned, []))).toBe('LEARN_NOT_AVAILABLE')
    expect(code(() => resolveLearnedOptions(combat, defs, learned, []))).toBe('LEARN_NOT_AVAILABLE')
  })

  it('is not available for an ability that cannot be learned', () => {
    expect(code(() => resolveLearnedOptions(modernMagic, defs, { blessing: ['war'] }, []))).toBe(
      'LEARN_NOT_AVAILABLE',
    )
    expect(code(() => resolveLearnedOptions(modernMagic, defs, { nope: ['x'] }, []))).toBe(
      'LEARN_NOT_AVAILABLE',
    )
  })

  it('rejects a count that is not a whole number of purchases', () => {
    expect(
      code(() => resolveLearnedOptions(modernMagic, defs, { cantrips: ['e'] }, known('a'))),
    ).toBe('LEARN_COUNT')
    expect(
      code(() => resolveLearnedOptions(modernMagic, defs, { cantrips: ['b', 'c', 'e'] }, [])),
    ).toBe('LEARN_COUNT')
  })

  it('rejects an option the ability does not offer', () => {
    expect(
      code(() => resolveLearnedOptions(modernMagic, defs, { cantrips: ['e', 'zzz'] }, [])),
    ).toBe('LEARN_INVALID')
  })

  it('rejects a repeat, or an ability the character already has', () => {
    expect(code(() => resolveLearnedOptions(modernMagic, defs, { cantrips: ['e', 'e'] }, []))).toBe(
      'LEARN_DUPLICATE',
    )
    expect(
      code(() =>
        resolveLearnedOptions(modernMagic, defs, { cantrips: ['a', 'f'] }, known('cantrips', 'a')),
      ),
    ).toBe('LEARN_DUPLICATE')
  })
})
