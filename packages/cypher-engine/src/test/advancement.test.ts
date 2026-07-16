import { describe, expect, it } from 'vitest'

import { ADVANCEMENT_COST_XP, ADVANCEMENTS_PER_TIER, STANDARD_ADVANCEMENTS } from '../advancement'

describe('advancement', () => {
  it('costs 4 XP per advancement', () => {
    expect(ADVANCEMENT_COST_XP).toBe(4)
  })

  it('requires exactly one purchase of each standard advancement per tier', () => {
    expect(ADVANCEMENTS_PER_TIER).toBe(STANDARD_ADVANCEMENTS.length)
  })

  it('exposes the four standard advancement options with unique ids', () => {
    const ids = STANDARD_ADVANCEMENTS.map((a) => a.id)
    expect(ids).toEqual([
      'increasing-capabilities',
      'moving-toward-perfection',
      'extra-effort',
      'skills',
    ])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("matches the rulebook's stated bonus amounts", () => {
    expect(STANDARD_ADVANCEMENTS.find((a) => a.id === 'increasing-capabilities')?.effect).toEqual({
      kind: 'stat_pool',
      amount: 4,
    })
    expect(STANDARD_ADVANCEMENTS.find((a) => a.id === 'moving-toward-perfection')?.effect).toEqual({
      kind: 'edge',
      amount: 1,
    })
    expect(STANDARD_ADVANCEMENTS.find((a) => a.id === 'extra-effort')?.effect).toEqual({
      kind: 'effort',
      amount: 1,
    })
    expect(STANDARD_ADVANCEMENTS.find((a) => a.id === 'skills')?.effect).toEqual({
      kind: 'skill',
      amount: 1,
    })
  })
})
