import { describe, expect, it } from 'vitest'

import { deriveEffort } from '../character/effort.js'

describe('deriveEffort', () => {
  it('starts at 1 with no purchases', () => {
    expect(deriveEffort([])).toBe(1)
  })

  it('adds 1 per extra-effort purchase', () => {
    expect(
      deriveEffort([
        { tier: 2, option: 'extra-effort' },
        { tier: 3, option: 'extra-effort' },
      ]),
    ).toBe(3)
  })

  it('ignores purchases of other advancement options', () => {
    expect(
      deriveEffort([
        { tier: 2, option: 'moving-toward-perfection', edge_stat: 'might' },
        {
          tier: 2,
          option: 'increasing-capabilities',
          stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
        },
      ]),
    ).toBe(1)
  })
})
