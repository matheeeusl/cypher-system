import { describe, expect, it } from 'vitest'

import { derivePoolMax } from '../character/pool'

// Real data from content/types/warrior.yaml: might 10, speed 10, intellect 8.
const warriorPools = { starting_pools: { might: 10, speed: 10, intellect: 8 } }

describe('derivePoolMax', () => {
  it('applies the Type base plus the 6-point creation allocation', () => {
    const pools = derivePoolMax(warriorPools, { might: 4, speed: 2, intellect: 0 }, undefined, [])
    expect(pools).toEqual({
      might: { max: 14 },
      speed: { max: 12 },
      intellect: { max: 8 },
    })
  })

  it('throws if the allocation does not sum to 6', () => {
    expect(() =>
      derivePoolMax(warriorPools, { might: 4, speed: 1, intellect: 0 }, undefined, []),
    ).toThrow(/sum to exactly 6/)
  })

  it('throws on a negative allocation value', () => {
    expect(() =>
      derivePoolMax(warriorPools, { might: 7, speed: -1, intellect: 0 }, undefined, []),
    ).toThrow(/non-negative/)
  })

  it('applies an optional Descriptor Pool bonus (e.g. Strong: +4 Might)', () => {
    const pools = derivePoolMax(
      warriorPools,
      { might: 2, speed: 2, intellect: 2 },
      { stat: 'might', amount: 4 },
      [],
    )
    expect(pools.might.max).toBe(16) // 10 + 2 + 4
  })

  it('applies increasing-capabilities advancement purchases, and validates each sums to 4', () => {
    const pools = derivePoolMax(warriorPools, { might: 2, speed: 2, intellect: 2 }, undefined, [
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
    ])
    expect(pools).toEqual({
      might: { max: 16 }, // 10 + 2 + 4
      speed: { max: 14 }, // 10 + 2 + 2
      intellect: { max: 12 }, // 8 + 2 + 2
    })
  })

  it('throws if an increasing-capabilities purchase does not sum to 4', () => {
    expect(() =>
      derivePoolMax(warriorPools, { might: 2, speed: 2, intellect: 2 }, undefined, [
        {
          tier: 2,
          option: 'increasing-capabilities',
          stat_pool_allocation: { might: 3, speed: 0, intellect: 0 },
        },
      ]),
    ).toThrow(/sum to exactly 4/)
  })

  it('ignores purchases of other advancement options', () => {
    const pools = derivePoolMax(warriorPools, { might: 2, speed: 2, intellect: 2 }, undefined, [
      { tier: 2, option: 'extra-effort' },
      { tier: 3, option: 'moving-toward-perfection', edge_stat: 'might' },
    ])
    expect(pools).toEqual({
      might: { max: 12 },
      speed: { max: 12 },
      intellect: { max: 10 },
    })
  })
})
