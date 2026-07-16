import { describe, expect, it } from 'vitest'

import { deriveEdge, resolveStartingEdge } from '../character/edge'
import type { Stat } from '../character/types'

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
