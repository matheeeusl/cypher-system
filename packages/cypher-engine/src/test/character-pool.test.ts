import { describe, expect, it } from 'vitest'

import { derivePoolMax, resolveDescriptorPoolChoice } from '../character/pool.js'

// Real data from content/types/warrior.yaml: might 10, speed 10, intellect 8.
const warriorPools = { starting_pools: { might: 10, speed: 10, intellect: 8 } }
const noBonus = { pool_bonus: [], pool_bonus_choice: null }

describe('derivePoolMax', () => {
  it('applies the Type base plus the 6-point creation allocation', () => {
    const pools = derivePoolMax(
      warriorPools,
      { might: 4, speed: 2, intellect: 0 },
      noBonus,
      undefined,
      [],
    )
    expect(pools).toEqual({
      might: { max: 14 },
      speed: { max: 12 },
      intellect: { max: 8 },
    })
  })

  it('throws if the allocation does not sum to 6', () => {
    expect(() =>
      derivePoolMax(warriorPools, { might: 4, speed: 1, intellect: 0 }, noBonus, undefined, []),
    ).toThrow(/sum to exactly 6/)
  })

  it('throws on a negative allocation value', () => {
    expect(() =>
      derivePoolMax(warriorPools, { might: 7, speed: -1, intellect: 0 }, noBonus, undefined, []),
    ).toThrow(/non-negative/)
  })

  it('applies a Descriptor Pool bonus (e.g. Strong: +4 Might)', () => {
    const strong = { pool_bonus: [{ stat: 'might' as const, amount: 4 }], pool_bonus_choice: null }
    const pools = derivePoolMax(
      warriorPools,
      { might: 2, speed: 2, intellect: 2 },
      strong,
      undefined,
      [],
    )
    expect(pools.might.max).toBe(16) // 10 + 2 + 4
  })

  it('applies every Descriptor Pool bonus, not just the first (Tongue-Tied)', () => {
    const tongueTied = {
      pool_bonus: [
        { stat: 'might' as const, amount: 2 },
        { stat: 'speed' as const, amount: 2 },
      ],
      pool_bonus_choice: null,
    }
    const pools = derivePoolMax(
      warriorPools,
      { might: 2, speed: 2, intellect: 2 },
      tongueTied,
      undefined,
      [],
    )
    expect(pools).toEqual({
      might: { max: 14 }, // 10 + 2 + 2
      speed: { max: 14 }, // 10 + 2 + 2
      intellect: { max: 10 },
    })
  })

  it('applies a negative Descriptor Pool bonus (Clumsy: +2 Might, −2 Speed)', () => {
    const clumsy = {
      pool_bonus: [
        { stat: 'might' as const, amount: 2 },
        { stat: 'speed' as const, amount: -2 },
      ],
      pool_bonus_choice: null,
    }
    const pools = derivePoolMax(
      warriorPools,
      { might: 2, speed: 2, intellect: 2 },
      clumsy,
      undefined,
      [],
    )
    expect(pools.might.max).toBe(14) // 10 + 2 + 2
    expect(pools.speed.max).toBe(10) // 10 + 2 − 2
  })

  it('applies increasing-capabilities advancement purchases, and validates each sums to 4', () => {
    const pools = derivePoolMax(
      warriorPools,
      { might: 2, speed: 2, intellect: 2 },
      noBonus,
      undefined,
      [
        {
          tier: 2,
          option: 'increasing-capabilities',
          stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
        },
        {
          tier: 3,
          option: 'increasing-capabilities',
          stat_pool_allocation: { might: 0, speed: 2, intellect: 2 },
        },
      ],
    )
    expect(pools).toEqual({
      might: { max: 16 }, // 10 + 2 + 4
      speed: { max: 14 }, // 10 + 2 + 2
      intellect: { max: 12 }, // 8 + 2 + 2
    })
  })

  it('throws if an increasing-capabilities purchase does not sum to 4', () => {
    expect(() =>
      derivePoolMax(warriorPools, { might: 2, speed: 2, intellect: 2 }, noBonus, undefined, [
        {
          tier: 2,
          option: 'increasing-capabilities',
          stat_pool_allocation: { might: 3, speed: 0, intellect: 0 },
        },
      ]),
    ).toThrow(/sum to exactly 4/)
  })

  it('ignores purchases of other advancement options', () => {
    const pools = derivePoolMax(
      warriorPools,
      { might: 2, speed: 2, intellect: 2 },
      noBonus,
      undefined,
      [
        { tier: 2, option: 'extra-effort' },
        { tier: 3, option: 'moving-toward-perfection', edge_stat: 'might' },
      ],
    )
    expect(pools).toEqual({
      might: { max: 12 },
      speed: { max: 12 },
      intellect: { max: 10 },
    })
  })
})

describe('resolveDescriptorPoolChoice', () => {
  // Real data: Hideous (4 among all three), Addicted (2 between Might and
  // Speed), Rusted (+2 Might | +2 Intellect | +1 to each).
  const hideous = {
    pool_bonus: [],
    pool_bonus_choice: {
      kind: 'divide' as const,
      points: 4,
      stats: ['might' as const, 'speed' as const, 'intellect' as const],
    },
  }
  const addicted = {
    pool_bonus: [],
    pool_bonus_choice: {
      kind: 'divide' as const,
      points: 2,
      stats: ['might' as const, 'speed' as const],
    },
  }
  const rusted = {
    pool_bonus: [],
    pool_bonus_choice: {
      kind: 'one-of' as const,
      options: [
        [{ stat: 'might' as const, amount: 2 }],
        [{ stat: 'intellect' as const, amount: 2 }],
        [
          { stat: 'might' as const, amount: 1 },
          { stat: 'speed' as const, amount: 1 },
          { stat: 'intellect' as const, amount: 1 },
        ],
      ],
    },
  }
  const codeOf = (fn: () => unknown) => {
    try {
      fn()
    } catch (err) {
      return (err as { code?: string }).code
    }
    return 'no error'
  }

  it('gives nothing extra when the Descriptor has no choice', () => {
    expect(resolveDescriptorPoolChoice(noBonus, undefined)).toEqual({
      might: 0,
      speed: 0,
      intellect: 0,
    })
  })

  it('rejects a choice the Descriptor does not offer', () => {
    expect(codeOf(() => resolveDescriptorPoolChoice(noBonus, { option_index: 0 }))).toBe(
      'DESCRIPTOR_POOL_CHOICE_UNEXPECTED',
    )
  })

  it('applies a divide allocation (Hideous: 4 points)', () => {
    const extra = resolveDescriptorPoolChoice(hideous, {
      allocation: { might: 1, speed: 0, intellect: 3 },
    })
    expect(extra).toEqual({ might: 1, speed: 0, intellect: 3 })
  })

  it('adds the divided points on top of the Type and the 6-point allocation', () => {
    const pools = derivePoolMax(
      warriorPools,
      { might: 2, speed: 2, intellect: 2 },
      hideous,
      { allocation: { might: 4, speed: 0, intellect: 0 } },
      [],
    )
    expect(pools.might.max).toBe(16) // 10 + 2 + 4
  })

  it.each([
    ['a missing answer', undefined, 'DESCRIPTOR_POOL_CHOICE_REQUIRED'],
    ['an option index instead of points', { option_index: 0 }, 'DESCRIPTOR_POOL_CHOICE_REQUIRED'],
    [
      'points that do not add up',
      { allocation: { might: 2, speed: 1, intellect: 0 } },
      'DESCRIPTOR_POOL_CHOICE_SUM',
    ],
    [
      'negative points',
      { allocation: { might: 5, speed: -1, intellect: 0 } },
      'POOL_ALLOCATION_NEGATIVE',
    ],
  ])('rejects %s for a divide choice', (_label, choice, code) => {
    expect(codeOf(() => resolveDescriptorPoolChoice(hideous, choice))).toBe(code)
  })

  it('rejects points on a stat the Descriptor leaves out (Addicted: no Intellect)', () => {
    expect(
      codeOf(() =>
        resolveDescriptorPoolChoice(addicted, {
          allocation: { might: 1, speed: 0, intellect: 1 },
        }),
      ),
    ).toBe('DESCRIPTOR_POOL_CHOICE_STAT')
  })

  it('applies the picked option (Rusted: +1 to each)', () => {
    expect(resolveDescriptorPoolChoice(rusted, { option_index: 2 })).toEqual({
      might: 1,
      speed: 1,
      intellect: 1,
    })
  })

  it.each([
    ['a missing answer', undefined, 'DESCRIPTOR_POOL_CHOICE_REQUIRED'],
    [
      'points instead of an option',
      { allocation: { might: 2, speed: 0, intellect: 0 } },
      'DESCRIPTOR_POOL_CHOICE_REQUIRED',
    ],
    ['an index past the last option', { option_index: 3 }, 'DESCRIPTOR_POOL_CHOICE_OPTION'],
    ['a fractional index', { option_index: 0.5 }, 'DESCRIPTOR_POOL_CHOICE_OPTION'],
  ])('rejects %s for a one-of choice', (_label, choice, code) => {
    expect(codeOf(() => resolveDescriptorPoolChoice(rusted, choice))).toBe(code)
  })
})
