import { describe, expect, it } from 'vitest'

import { FLAVOR_GAIN_COST_XP } from '../advancement.js'
import { applyFlavorGain } from '../character/flavor-gain.js'
import { CharacterRuleError } from '../errors.js'

// A Type that offers bash/swipe at tier 1 and slam at tier 2, and a flavor whose
// danger-sense is tier 1, vanish tier 2 and blur tier 3.
const type = {
  id: 'warrior',
  special_ability_id: 'fighting-moves',
  tier_abilities: { '1': ['bash', 'swipe', 'overwatch', 'improved-edge'], '2': ['slam'] },
}
const stealth = {
  id: 'stealth',
  tier_abilities: { '1': ['danger-sense', 'bash'], '2': ['vanish'], '3': ['blur'] },
}
const content = { type, flavor: stealth }
const base = {
  flavor_id: null,
  tier_1_type_ability_ids: ['bash', 'swipe', 'overwatch', 'improved-edge'],
  type_ability_picks: { '2': ['slam'] },
  advancement_purchases: [],
}
const gain = (swaps: Array<{ tier: number; replaces: string; with: string }>) => ({
  ...base,
  flavor_gain: { flavor_id: 'stealth', swaps },
})

const code = (fn: () => unknown) => {
  try {
    fn()
  } catch (error) {
    return error instanceof CharacterRuleError ? error.code : 'other'
  }
  return null
}

describe('FLAVOR_GAIN_COST_XP', () => {
  it('is 4 XP', () => expect(FLAVOR_GAIN_COST_XP).toBe(4))
})

describe('applyFlavorGain', () => {
  it('returns the choices untouched when there is no gain', () => {
    expect(applyFlavorGain(base, content)).toBe(base)
  })

  it('makes the gained flavor the character’s flavor, with no swaps', () => {
    const result = applyFlavorGain(gain([]), content)
    expect(result.flavor_id).toBe('stealth')
    expect(result).not.toHaveProperty('flavor_gain')
    expect(result.tier_1_type_ability_ids).toEqual(base.tier_1_type_ability_ids)
  })

  it('swaps a tier-1 pick for a tier-1 flavor ability, in place', () => {
    const result = applyFlavorGain(
      gain([{ tier: 1, replaces: 'swipe', with: 'danger-sense' }]),
      content,
    )
    expect(result.tier_1_type_ability_ids).toEqual([
      'bash',
      'danger-sense',
      'overwatch',
      'improved-edge',
    ])
  })

  it('swaps a later pick, and lets a pick of tier N take a flavor ability of tier N or lower', () => {
    const result = applyFlavorGain(gain([{ tier: 2, replaces: 'slam', with: 'vanish' }]), content)
    expect(result.type_ability_picks).toEqual({ '2': ['vanish'] })
    const lower = applyFlavorGain(
      gain([{ tier: 2, replaces: 'slam', with: 'danger-sense' }]),
      content,
    )
    expect(lower.type_ability_picks).toEqual({ '2': ['danger-sense'] })
  })

  it('refuses a flavor ability of a higher tier than the pick', () => {
    expect(
      code(() => applyFlavorGain(gain([{ tier: 2, replaces: 'slam', with: 'blur' }]), content)),
    ).toBe('FLAVOR_SWAP_WITH_INVALID')
  })

  it('refuses an ability the flavor does not have, or the Type already offers', () => {
    expect(
      code(() => applyFlavorGain(gain([{ tier: 1, replaces: 'swipe', with: 'nope' }]), content)),
    ).toBe('FLAVOR_SWAP_WITH_INVALID')
    // bash is in both lists: picking it is not an exchange
    expect(
      code(() => applyFlavorGain(gain([{ tier: 1, replaces: 'swipe', with: 'bash' }]), content)),
    ).toBe('FLAVOR_SWAP_WITH_INVALID')
  })

  it('refuses to give up something that is not a Type pick at that tier', () => {
    const swap = (replaces: string, tier = 1) =>
      code(() => applyFlavorGain(gain([{ tier, replaces, with: 'danger-sense' }]), content))
    expect(swap('slam')).toBe('FLAVOR_SWAP_REPLACES_INVALID') // a tier-2 pick, not tier 1
    expect(swap('nope')).toBe('FLAVOR_SWAP_REPLACES_INVALID')
    expect(swap('fighting-moves')).toBe('FLAVOR_SWAP_REPLACES_INVALID') // the Type’s own ability
  })

  it('refuses to give up an ability a Skills advancement trained', () => {
    const trained = {
      ...gain([{ tier: 1, replaces: 'swipe', with: 'danger-sense' }]),
      advancement_purchases: [
        {
          tier: 2,
          option: 'skills' as const,
          target: { kind: 'ability' as const, ability_id: 'swipe' },
        },
      ],
    }
    expect(code(() => applyFlavorGain(trained, content))).toBe('FLAVOR_SWAP_REPLACES_INVALID')
  })

  it('refuses a repeated exchange', () => {
    expect(
      code(() =>
        applyFlavorGain(
          gain([
            { tier: 1, replaces: 'swipe', with: 'danger-sense' },
            { tier: 1, replaces: 'swipe', with: 'vanish' },
          ]),
          content,
        ),
      ),
    ).toBe('FLAVOR_SWAP_DUPLICATE')
    expect(
      code(() =>
        applyFlavorGain(
          gain([
            { tier: 1, replaces: 'swipe', with: 'danger-sense' },
            { tier: 1, replaces: 'overwatch', with: 'danger-sense' },
          ]),
          content,
        ),
      ),
    ).toBe('FLAVOR_SWAP_DUPLICATE')
  })

  it('refuses to take a flavor ability the character already has', () => {
    const has = {
      ...gain([{ tier: 2, replaces: 'slam', with: 'vanish' }]),
      tier_1_type_ability_ids: ['vanish', 'swipe', 'overwatch', 'improved-edge'],
    }
    expect(code(() => applyFlavorGain(has, content))).toBe('FLAVOR_SWAP_WITH_INVALID')
  })

  it('does not let the ability given up be picked again later', () => {
    const repicked = {
      ...gain([{ tier: 1, replaces: 'swipe', with: 'danger-sense' }]),
      type_ability_picks: { '2': ['swipe'] },
    }
    expect(code(() => applyFlavorGain(repicked, content))).toBe('FLAVOR_SWAP_REPICKED')
  })

  it('allows only one flavor per character', () => {
    expect(code(() => applyFlavorGain({ ...gain([]), flavor_id: 'combat' }, content))).toBe(
      'FLAVOR_GAIN_CONFLICT',
    )
  })

  it('needs the gained flavor’s content', () => {
    expect(code(() => applyFlavorGain(gain([]), { type, flavor: null }))).toBe('FLAVOR_UNKNOWN')
    expect(
      code(() => applyFlavorGain(gain([]), { type, flavor: { ...stealth, id: 'other' } })),
    ).toBe('FLAVOR_UNKNOWN')
  })
})
