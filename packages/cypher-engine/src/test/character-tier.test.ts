import { describe, expect, it } from 'vitest'

import { deriveTier } from '../character/tier'
import type { AdvancementPurchase } from '../character/types'

function completeTier(tier: number): AdvancementPurchase[] {
  return [
    {
      tier,
      option: 'increasing-capabilities',
      stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
    },
    { tier, option: 'moving-toward-perfection', edge_stat: 'might' },
    { tier, option: 'extra-effort' },
    { tier, option: 'skills', target: { kind: 'skill', skill_id: 'climbing' } },
  ]
}

describe('deriveTier', () => {
  it('is tier 1 with no purchases', () => {
    expect(deriveTier([])).toBe(1)
  })

  it('advances to tier 2 once all 4 standard advancements are purchased for it', () => {
    expect(deriveTier(completeTier(2))).toBe(2)
  })

  it('advances through consecutive completed tiers', () => {
    expect(deriveTier([...completeTier(2), ...completeTier(3)])).toBe(3)
  })

  it('throws if the same advancement option is purchased twice in one tier', () => {
    const purchases: AdvancementPurchase[] = [
      { tier: 2, option: 'extra-effort' },
      { tier: 2, option: 'extra-effort' },
      { tier: 2, option: 'moving-toward-perfection', edge_stat: 'might' },
      { tier: 2, option: 'skills', target: { kind: 'skill', skill_id: 'climbing' } },
    ]
    expect(() => deriveTier(purchases)).toThrow(/repeat the same advancement option/)
  })

  it('throws if a tier has fewer than the 4 standard advancements', () => {
    const purchases = completeTier(2).slice(0, 3)
    expect(() => deriveTier(purchases)).toThrow(/different number were supplied/)
  })

  it('throws if a later tier has purchases while an earlier tier does not (gap)', () => {
    expect(() => deriveTier(completeTier(3))).toThrow(/tiers must complete in order/)
  })

  it('throws a "not yet supported" error for a non-standard (substitution) option', () => {
    const purchases = [
      { tier: 2, option: 'reduce-armor-speed-cost' },
    ] as unknown as AdvancementPurchase[]
    expect(() => deriveTier(purchases)).toThrow(/not yet supported/)
  })
})
