import { describe, expect, it } from 'vitest'

import { deriveEdge, resolveStartingEdge, type EdgeGrantInstance } from '../character/edge.js'
import type { PendingPick, Stat } from '../character/types.js'

// Real data from content/types/warrior.yaml and adept.yaml.
const warriorEdge: { stat_choices: Stat[]; amount: number } = {
  stat_choices: ['might', 'speed'],
  amount: 1,
}
const adeptEdge: { stat_choices: Stat[]; amount: number } = {
  stat_choices: ['intellect'],
  amount: 1,
}

describe('resolveStartingEdge', () => {
  it('resolves a fixed single-choice Type without requiring a choice', () => {
    expect(resolveStartingEdge({ starting_edge: adeptEdge })).toEqual({
      stat: 'intellect',
      amount: 1,
    })
  })

  it('throws if a choice is required (Warrior) but missing', () => {
    expect(() => resolveStartingEdge({ starting_edge: warriorEdge })).toThrow(/required/i)
  })

  it('resolves a Type with a real choice (Warrior) when given a valid pick', () => {
    expect(resolveStartingEdge({ starting_edge: warriorEdge }, 'speed')).toEqual({
      stat: 'speed',
      amount: 1,
    })
  })

  it('throws if the choice is not one of the Type stat_choices', () => {
    expect(() => resolveStartingEdge({ starting_edge: warriorEdge }, 'intellect')).toThrow(
      /must be one of/i,
    )
  })

  it('throws if a choice is supplied for a Type with no real choice (Adept)', () => {
    expect(() => resolveStartingEdge({ starting_edge: adeptEdge }, 'intellect')).toThrow(
      /only one eligible/i,
    )
  })
})

describe('deriveEdge', () => {
  it('starts from the resolved starting Edge, 0 elsewhere', () => {
    expect(deriveEdge({ stat: 'might', amount: 1 }, [])).toEqual({
      might: 1,
      speed: 0,
      intellect: 0,
    })
  })

  it('adds 1 per moving-toward-perfection purchase on the targeted stat', () => {
    const edge = deriveEdge({ stat: 'might', amount: 1 }, [
      { tier: 2, option: 'moving-toward-perfection', edge_stat: 'speed' },
      { tier: 3, option: 'moving-toward-perfection', edge_stat: 'speed' },
      { tier: 4, option: 'moving-toward-perfection', edge_stat: 'intellect' },
    ])
    expect(edge).toEqual({ might: 1, speed: 2, intellect: 1 })
  })

  it('ignores purchases of other advancement options', () => {
    const edge = deriveEdge({ stat: 'might', amount: 1 }, [
      { tier: 2, option: 'extra-effort' },
      {
        tier: 2,
        option: 'increasing-capabilities',
        stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
      },
    ])
    expect(edge).toEqual({ might: 1, speed: 0, intellect: 0 })
  })
})

describe('deriveEdge with Edge-granting abilities', () => {
  // Real data from content/abilities/improved-edge.yaml and enhanced-speed-edge.yaml.
  const improvedEdge = (tier: number): EdgeGrantInstance => ({
    key: `type:${tier}:improved-edge`,
    ability_id: 'improved-edge',
    kind: 'type',
    tier,
    grant: { kind: 'choose_zero' },
  })
  const enhancedSpeedEdge = (tier: number): EdgeGrantInstance => ({
    key: `focus:${tier}:enhanced-speed-edge`,
    ability_id: 'enhanced-speed-edge',
    kind: 'focus',
    tier,
    grant: { kind: 'fixed', stat: 'speed', amount: 1 },
  })
  const warriorMight = { stat: 'might', amount: 1 } as const

  it('adds a fixed grant to its stat', () => {
    expect(deriveEdge(warriorMight, [], [enhancedSpeedEdge(2)])).toEqual({
      might: 1,
      speed: 1,
      intellect: 0,
    })
  })

  it('raises the picked stat from 0 to 1 for Improved Edge', () => {
    const edge = deriveEdge(warriorMight, [], [improvedEdge(1)], {
      'type:1:improved-edge': 'speed',
    })
    expect(edge).toEqual({ might: 1, speed: 1, intellect: 0 })
  })

  it('refuses an Improved Edge pick whose Edge is not 0', () => {
    expect(() =>
      deriveEdge(warriorMight, [], [improvedEdge(1)], { 'type:1:improved-edge': 'might' }),
    ).toThrow(/only raise an Edge that is 0/)
  })

  // A purchase tagged 3 leads to tier 3, so it comes before the tier-3 pick.
  it('checks the pick against the Edge at the tier the ability was gained', () => {
    const raiseSpeed = { tier: 3, option: 'moving-toward-perfection', edge_stat: 'speed' } as const
    expect(() =>
      deriveEdge(warriorMight, [raiseSpeed], [improvedEdge(3)], {
        'type:3:improved-edge': 'speed',
      }),
    ).toThrow(/only raise an Edge that is 0/)
    // Raised only after the pick (tier 4): the pick was valid when made.
    expect(
      deriveEdge(warriorMight, [{ ...raiseSpeed, tier: 4 }], [improvedEdge(3)], {
        'type:3:improved-edge': 'speed',
      }),
    ).toEqual({ might: 1, speed: 2, intellect: 0 })
  })

  it('counts a fixed grant from an earlier tier before the pick', () => {
    expect(() =>
      deriveEdge(warriorMight, [], [enhancedSpeedEdge(2), improvedEdge(3)], {
        'type:3:improved-edge': 'speed',
      }),
    ).toThrow(/only raise an Edge that is 0/)
  })

  it('reports a missing pick as pending, without changing the Edge', () => {
    const pending: PendingPick[] = []
    expect(deriveEdge(warriorMight, [], [improvedEdge(1)], {}, pending)).toEqual({
      might: 1,
      speed: 0,
      intellect: 0,
    })
    expect(pending).toEqual([
      { kind: 'edge', tier: 1, key: 'type:1:improved-edge', ability_id: 'improved-edge' },
    ])
  })

  it('owes no pick when no Edge is 0 any more', () => {
    const pending: PendingPick[] = []
    const purchases = [
      { tier: 2, option: 'moving-toward-perfection', edge_stat: 'speed' },
      { tier: 3, option: 'moving-toward-perfection', edge_stat: 'intellect' },
    ] as const
    deriveEdge(warriorMight, [...purchases], [improvedEdge(3)], {}, pending)
    expect(pending).toEqual([])
  })

  it('rejects a pick for an ability the character has no Edge choice for', () => {
    expect(() =>
      deriveEdge(warriorMight, [], [enhancedSpeedEdge(2)], {
        'focus:2:enhanced-speed-edge': 'speed',
      }),
    ).toThrow(/matches no Edge choice/)
  })
})
