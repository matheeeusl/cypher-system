import { describe, expect, it } from 'vitest'

import {
  abilityChoiceKey,
  collectAbilityChoiceInstances,
  resolveAbilityChoices,
} from '../character/ability-choices.js'
import type { KnownAbility, PendingPick } from '../character/types.js'
import { CharacterRuleError } from '../errors.js'

// Shaped like content/abilities/blessing-of-the-gods.yaml (trimmed): picking the
// ability asks for 2 of its options.
const defs = { blessing: { options: ['war', 'sky', 'water', 'death'], count: 2 } }
const flavorSource = { kind: 'flavor', flavor_id: 'magic' } as const
const known = (...ids: string[]): KnownAbility[] =>
  ids.map((ability_id) => ({ ability_id, source: flavorSource, trained: false }))

describe('collectAbilityChoiceInstances', () => {
  it('finds the choice abilities among the tier-1 picks and the later Type picks', () => {
    const instances = collectAbilityChoiceInstances(
      3,
      { tier_1_type_ability_ids: ['bash', 'blessing'], type_ability_picks: { '3': ['blessing'] } },
      defs,
    )
    expect(instances.map((i) => i.key)).toEqual(['type:1:blessing', 'type:3:blessing'])
  })

  it('ignores picks for tiers not reached and abilities without a choice', () => {
    const instances = collectAbilityChoiceInstances(
      2,
      { tier_1_type_ability_ids: ['bash'], type_ability_picks: { '4': ['blessing'] } },
      defs,
    )
    expect(instances).toEqual([])
  })

  it('builds the key like a Type skill-grant key', () => {
    expect(abilityChoiceKey(1, 'blessing')).toBe('type:1:blessing')
  })
})

describe('resolveAbilityChoices', () => {
  const instances = collectAbilityChoiceInstances(
    1,
    { tier_1_type_ability_ids: ['blessing'] },
    defs,
  )

  it('turns the picked options into known abilities with the choice ability’s source', () => {
    const pending: PendingPick[] = []
    const result = resolveAbilityChoices(
      instances,
      { 'type:1:blessing': ['war', 'sky'] },
      known('blessing'),
      pending,
    )
    expect(result).toEqual([
      { ability_id: 'war', source: flavorSource, trained: false },
      { ability_id: 'sky', source: flavorSource, trained: false },
    ])
    expect(pending).toEqual([])
  })

  it('reports a shortfall as a pending pick instead of an error', () => {
    const pending: PendingPick[] = []
    const result = resolveAbilityChoices(
      instances,
      { 'type:1:blessing': ['war'] },
      known('blessing'),
      pending,
    )
    expect(result.map((a) => a.ability_id)).toEqual(['war'])
    expect(pending).toEqual([
      {
        kind: 'option',
        tier: 1,
        key: 'type:1:blessing',
        ability_id: 'blessing',
        required: 2,
        chosen: 1,
      },
    ])
  })

  it('is fully pending when nothing was picked', () => {
    const pending: PendingPick[] = []
    resolveAbilityChoices(instances, {}, known('blessing'), pending)
    expect(pending).toMatchObject([{ kind: 'option', required: 2, chosen: 0 }])
  })

  const code = (fn: () => unknown) => {
    try {
      fn()
    } catch (err) {
      return (err as CharacterRuleError).code
    }
    return null
  }

  it('rejects too many picks, an option the ability does not offer, and a repeated option', () => {
    const run = (picks: string[]) => () =>
      resolveAbilityChoices(instances, { 'type:1:blessing': picks }, known('blessing'), [])
    expect(code(run(['war', 'sky', 'water']))).toBe('ABILITY_CHOICE_COUNT')
    expect(code(run(['war', 'fire']))).toBe('ABILITY_CHOICE_INVALID')
    expect(code(run(['war', 'war']))).toBe('ABILITY_CHOICE_DUPLICATE')
  })

  it('rejects an option the character already knows', () => {
    expect(
      code(() =>
        resolveAbilityChoices(
          instances,
          { 'type:1:blessing': ['war', 'sky'] },
          known('blessing', 'war'),
          [],
        ),
      ),
    ).toBe('ABILITY_CHOICE_DUPLICATE')
  })

  it('rejects picks that belong to no choice ability the character has', () => {
    expect(
      code(() =>
        resolveAbilityChoices(instances, { 'type:2:blessing': ['war'] }, known('blessing'), []),
      ),
    ).toBe('ABILITY_CHOICE_UNKNOWN')
  })
})
