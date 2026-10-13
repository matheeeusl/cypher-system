import { describe, expect, it } from 'vitest'

import { resolveFocusAbilities } from '../character/focus-abilities.js'
import type { PendingPick } from '../character/types.js'

// Real data: content/foci/wields-two-weapons-at-once.yaml has only tier 1
// today (stub content). Tiers 2-6 below are an inline fixture built from
// the same Focus's real rulebook text (extracted during planning), not
// shipped content — see the plan's rationale for keeping the stub minimal.
const wieldsTwoWeapons = {
  id: 'wields-two-weapons-at-once',
  tier_abilities: {
    '1': [{ kind: 'granted' as const, ability_id: 'dual-light-wield' }],
    '2': [
      { kind: 'granted' as const, ability_id: 'double-strike' },
      { kind: 'granted' as const, ability_id: 'infiltrator' },
    ],
    '3': [{ kind: 'choice' as const, options: ['dual-medium-wield', 'precise-cut'], count: 1 }],
    '4': [{ kind: 'granted' as const, ability_id: 'dual-defense' }],
    '5': [{ kind: 'granted' as const, ability_id: 'dual-distraction' }],
    '6': [{ kind: 'choice' as const, options: ['disarming-attack', 'spin-attack'], count: 1 }],
  },
}

describe('resolveFocusAbilities', () => {
  it('resolves only the automatic tier-1 grant for a tier-1 character', () => {
    const abilities = resolveFocusAbilities(wieldsTwoWeapons, 1, {})
    expect(abilities).toEqual([
      {
        ability_id: 'dual-light-wield',
        source: { kind: 'focus', focus_id: 'wields-two-weapons-at-once' },
        trained: false,
      },
    ])
  })

  it('resolves multiple automatic grants at one tier (tier 2: both Double Strike and Infiltrator)', () => {
    const abilities = resolveFocusAbilities(wieldsTwoWeapons, 2, {})
    expect(abilities.map((a) => a.ability_id)).toEqual([
      'dual-light-wield',
      'double-strike',
      'infiltrator',
    ])
  })

  it('resolves a tier-3 choice using the supplied selection', () => {
    const abilities = resolveFocusAbilities(wieldsTwoWeapons, 3, { '3': ['precise-cut'] })
    expect(abilities.map((a) => a.ability_id)).toContain('precise-cut')
    expect(abilities.map((a) => a.ability_id)).not.toContain('dual-medium-wield')
  })

  it('throws if a reached choice tier has no selection', () => {
    expect(() => resolveFocusAbilities(wieldsTwoWeapons, 3, {})).toThrow(
      /no selection was supplied/,
    )
  })

  it("throws if the selection is not one of that tier's two options", () => {
    expect(() => resolveFocusAbilities(wieldsTwoWeapons, 3, { '3': ['dual-light-wield'] })).toThrow(
      /not a valid set of that tier's options/,
    )
  })

  it('reports a missing tier 2+ selection as a pending pick instead of throwing', () => {
    const pending: PendingPick[] = []
    const abilities = resolveFocusAbilities(wieldsTwoWeapons, 3, {}, pending)
    expect(pending).toEqual([{ kind: 'focus', tier: 3, required: 1, chosen: 0 }])
    expect(abilities.map((a) => a.ability_id)).not.toContain('dual-medium-wield')
  })

  it('still requires the tier-1 selection even when pending picks are allowed', () => {
    const channels = {
      id: 'channels',
      tier_abilities: {
        '1': [{ kind: 'choice' as const, options: ['a', 'b', 'c'], count: 2 }],
      },
    }
    expect(() => resolveFocusAbilities(channels, 1, {}, [])).toThrow(/no selection was supplied/)
  })

  it('supports count > 1 and bundled-pair options', () => {
    const focus = {
      id: 'f',
      tier_abilities: {
        '3': [{ kind: 'choice' as const, options: ['x', ['y', 'z'], 'w'], count: 2 }],
      },
    }
    const ids = (sel: string[]) =>
      resolveFocusAbilities(focus, 3, { '3': sel }).map((a) => a.ability_id)
    expect(ids(['x', 'y', 'z'])).toEqual(['x', 'y', 'z'])
    expect(() => resolveFocusAbilities(focus, 3, { '3': ['x', 'y'] })).toThrow(/valid set/)
    expect(() => resolveFocusAbilities(focus, 3, { '3': ['x'] })).toThrow(/valid set/)
    expect(() => resolveFocusAbilities(focus, 3, { '3': ['x', 'x'] })).toThrow(/valid set/)
  })

  it("ignores tiers beyond the character's current tier", () => {
    const abilities = resolveFocusAbilities(wieldsTwoWeapons, 2, {})
    expect(abilities.map((a) => a.ability_id)).not.toContain('dual-defense')
  })

  it('resolves both choice tiers (3 and 6) for a tier-6 character', () => {
    const abilities = resolveFocusAbilities(wieldsTwoWeapons, 6, {
      '3': ['dual-medium-wield'],
      '6': ['spin-attack'],
    })
    expect(abilities.map((a) => a.ability_id)).toEqual([
      'dual-light-wield',
      'double-strike',
      'infiltrator',
      'dual-medium-wield',
      'dual-defense',
      'dual-distraction',
      'spin-attack',
    ])
  })
})
