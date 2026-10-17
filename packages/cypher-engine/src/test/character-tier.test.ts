import { describe, expect, it } from 'vitest'

import { deriveTier } from '../character/tier.js'
import type { AdvancementPurchase } from '../character/types.js'

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

  it('stays on the current tier while the newest tier is only partly purchased', () => {
    expect(deriveTier(completeTier(2).slice(0, 3))).toBe(1)
    expect(deriveTier([...completeTier(2), ...completeTier(3).slice(0, 1)])).toBe(2)
  })

  it('throws if an earlier tier has fewer than the 4 standard advancements', () => {
    const purchases = [...completeTier(2).slice(0, 3), ...completeTier(3)]
    expect(() => deriveTier(purchases)).toThrow(/different number were supplied/)
  })

  it('throws if a later tier has purchases while an earlier tier does not (gap)', () => {
    expect(() => deriveTier(completeTier(3))).toThrow(/tiers must complete in order/)
  })

  it('closes a tier with 3 standard advancements and 1 Other option', () => {
    const purchases: AdvancementPurchase[] = [
      ...completeTier(2).slice(0, 3),
      { tier: 2, option: 'recovery-roll-bonus' },
    ]
    expect(deriveTier(purchases)).toBe(2)
  })

  it('counts an Other option towards a partly bought tier', () => {
    expect(deriveTier([{ tier: 2, option: 'reduce-armor-speed-cost' }])).toBe(1)
  })

  it('throws if a tier has more than one Other option', () => {
    const purchases: AdvancementPurchase[] = [
      ...completeTier(2).slice(0, 2),
      { tier: 2, option: 'recovery-roll-bonus' },
      { tier: 2, option: 'reduce-armor-speed-cost' },
    ]
    expect(() => deriveTier(purchases)).toThrow(/more than one Other option/)
  })

  it('throws if the same Other option is bought twice in one tier', () => {
    const purchases: AdvancementPurchase[] = [
      { tier: 2, option: 'recovery-roll-bonus' },
      { tier: 2, option: 'recovery-roll-bonus' },
    ]
    expect(() => deriveTier(purchases)).toThrow(/more than one Other option/)
  })

  it('allows an Other option in each tier', () => {
    const purchases: AdvancementPurchase[] = [
      ...completeTier(2).slice(0, 3),
      { tier: 2, option: 'recovery-roll-bonus' },
      ...completeTier(3).slice(1),
      { tier: 3, option: 'recovery-roll-bonus' },
    ]
    expect(deriveTier(purchases)).toBe(3)
  })

  it('throws if a tier has more than 4 purchases', () => {
    const purchases: AdvancementPurchase[] = [
      ...completeTier(2),
      { tier: 2, option: 'recovery-roll-bonus' },
    ]
    expect(() => deriveTier(purchases)).toThrow(/different number were supplied/)
  })

  it('throws for an unknown option', () => {
    const purchases = [{ tier: 2, option: 'fly' }] as unknown as AdvancementPurchase[]
    expect(() => deriveTier(purchases)).toThrow(/not a known advancement/)
  })
})
