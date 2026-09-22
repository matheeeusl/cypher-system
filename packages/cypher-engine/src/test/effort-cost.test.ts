import { describe, expect, it } from 'vitest'

import { effortCost } from '../effort-cost.js'

describe('effortCost', () => {
  it('returns 0 for 0 levels regardless of edge', () => {
    expect(effortCost(0, 0)).toBe(0)
    expect(effortCost(0, 3)).toBe(0)
  })

  it('matches the rulebook table for 1 level of Effort', () => {
    expect(effortCost(1, 0)).toBe(3)
    expect(effortCost(1, 1)).toBe(2)
    expect(effortCost(1, 2)).toBe(1)
    expect(effortCost(1, 3)).toBe(0) // Edge fully covers it
    expect(effortCost(1, 6)).toBe(0) // floors at 0, doesn't go negative
  })

  it('matches the rulebook table for 3 levels of Effort', () => {
    expect(effortCost(3, 0)).toBe(7)
    expect(effortCost(3, 4)).toBe(3)
    expect(effortCost(3, 6)).toBe(1)
  })

  it('applies weakness as a flat +1 before the edge floor', () => {
    expect(effortCost(1, 0, true)).toBe(4)
    expect(effortCost(1, 2, true)).toBe(2) // 3+1-2
  })

  it('rejects levels outside 0-6', () => {
    expect(() => effortCost(7, 0)).toThrow()
    expect(() => effortCost(-1, 0)).toThrow()
  })
})
