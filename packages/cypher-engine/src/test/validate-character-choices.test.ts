import { describe, expect, it } from 'vitest'
import type { Descriptor, Focus, Type } from '@cypher/content'

import { deriveCharacter } from '../character.js'
import type { AdvancementPurchase, CharacterChoices } from '../character/types.js'
import { validateCharacterChoices } from '../validate-character-choices.js'

// Same real-data fixtures as character.test.ts.
const warrior: Type = {
  id: 'warrior',
  name: { en: 'Warrior', 'pt-BR': 'Guerreiro' },
  tagline: { en: "You're a good ally to have in a fight.", 'pt-BR': '' },
  description: {
    individual_role: { en: '', 'pt-BR': '' },
    group_role: { en: '', 'pt-BR': '' },
    societal_role: { en: '', 'pt-BR': '' },
  },
  player_intrusions: [],
  starting_pools: { might: 10, speed: 10, intellect: 8 },
  starting_edge: { stat_choices: ['might', 'speed'], amount: 1 },
  special_ability_id: null,
  weapon_proficiency: { practiced: ['light', 'medium', 'heavy'], inability: [] },
  starting_skills: [],
  starting_equipment: [],
  tier_abilities: {
    '1': [
      'bash',
      'combat-prowess',
      'control-the-field',
      'improved-edge',
      'no-need-for-weapons',
      'overwatch',
      'physical-skills',
      'practiced-in-armor',
      'quick-throw',
      'swipe',
      'trained-without-armor',
    ],
  },
}

const strong: Descriptor = {
  id: 'strong',
  name: { en: 'Strong', 'pt-BR': 'Forte' },
  description: { en: '', 'pt-BR': '' },
  skill_bonuses: ['smashing', 'jumping'],
  skill_inabilities: [],
  initial_bonus: { en: 'Very Powerful: +4 to your Might Pool.', 'pt-BR': '' },
  connection_text: { en: '', 'pt-BR': '' },
}

const wieldsTwoWeapons: Focus = {
  id: 'wields-two-weapons-at-once',
  name: { en: 'Wields Two Weapons at Once', 'pt-BR': '' },
  description: { en: 'You bear steel with both hands, ready to take on any foe.', 'pt-BR': '' },
  connection_text: { en: '', 'pt-BR': '' },
  tier_abilities: {
    '1': [{ kind: 'granted', ability_id: 'dual-light-wield' }],
    '2': [
      { kind: 'granted', ability_id: 'double-strike' },
      { kind: 'granted', ability_id: 'infiltrator' },
    ],
    '3': [{ kind: 'choice', options: ['dual-medium-wield', 'precise-cut'] }],
  },
}

const content = { type: warrior, descriptor: strong, focus: wieldsTwoWeapons }

function completeTier(
  tier: number,
  skillsTarget: AdvancementPurchase & { option: 'skills' },
): AdvancementPurchase[] {
  return [
    {
      tier,
      option: 'increasing-capabilities',
      stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
    },
    { tier, option: 'moving-toward-perfection', edge_stat: 'might' },
    { tier, option: 'extra-effort' },
    { ...skillsTarget, tier },
  ]
}

const validChoices: CharacterChoices = {
  type_id: 'warrior',
  descriptor_id: 'strong',
  focus_id: 'wields-two-weapons-at-once',
  starting_edge_choice: 'speed',
  pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
  descriptor_pool_bonus: { stat: 'might', amount: 4 },
  tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'improved-edge'],
  focus_choice_selections: { '3': 'dual-medium-wield' },
  advancement_purchases: [
    ...completeTier(2, {
      tier: 2,
      option: 'skills',
      target: { kind: 'skill', skill_id: 'perception' },
    }),
    ...completeTier(3, {
      tier: 3,
      option: 'skills',
      target: { kind: 'ability', ability_id: 'bash' },
    }),
  ],
}

describe('validateCharacterChoices', () => {
  it('returns valid: true for a fully valid build, matching deriveCharacter exactly', () => {
    const result = validateCharacterChoices(validChoices, content)
    expect(result.valid).toBe(true)
    expect(result).toEqual({ valid: true, character: deriveCharacter(validChoices, content) })
  })

  it('collects multiple simultaneous, independent errors instead of stopping at the first', () => {
    const choices: CharacterChoices = {
      ...validChoices,
      pool_point_allocation: { might: 2, speed: 2, intellect: 1 }, // sums to 5, not 6
      focus_choice_selections: { '3': 'not-a-real-option' }, // invalid for tier 3's choice
    }

    const result = validateCharacterChoices(choices, content)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid result')

    expect(result.errors.some((e) => /sum to exactly 6/.test(e))).toBe(true)
    expect(result.errors.some((e) => /not one of that tier's two options/.test(e))).toBe(true)
  })

  it('blocks Focus ability validation when tier resolution fails, without attempting it against a guessed tier', () => {
    const choices: CharacterChoices = {
      ...validChoices,
      // Incomplete tier 2 (only 3 of the 4 standard advancements) -> deriveTier throws.
      advancement_purchases: completeTier(2, {
        tier: 2,
        option: 'skills',
        target: { kind: 'skill', skill_id: 'perception' },
      }).slice(0, 3),
      // No tier-3 selection supplied. If resolveFocusAbilities were (incorrectly)
      // attempted anyway with some guessed tier >= 3, this would additionally
      // throw "no selection was supplied" — its absence proves it wasn't attempted.
      focus_choice_selections: {},
    }

    const result = validateCharacterChoices(choices, content)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid result')

    expect(result.errors.some((e) => /different number were supplied/.test(e))).toBe(true)
    expect(result.errors).toContain(
      'Focus abilities cannot be validated: tier must be resolved first',
    )
    expect(result.errors.some((e) => /no selection was supplied/.test(e))).toBe(false)
  })

  it('blocks ability-training purchase validation when known-abilities resolution fails, without a spurious "not known" error', () => {
    const choices: CharacterChoices = {
      ...validChoices,
      // Only 3 tier-1 Type abilities chosen -> resolveTypeAbilities throws.
      tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe'],
    }

    const result = validateCharacterChoices(choices, content)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid result')

    expect(result.errors.some((e) => /exactly 4/i.test(e))).toBe(true)
    expect(result.errors).toContain(
      'Ability-training purchases cannot be validated: known abilities must be resolved first',
    )
    expect(result.errors.some((e) => /isn't among this character's known abilities/.test(e))).toBe(
      false,
    )
  })

  it('reports every independently-bad advancement purchase, not just the first', () => {
    const choices: CharacterChoices = {
      ...validChoices,
      advancement_purchases: [
        // tier 2: trains 'smashing' (already trained via Strong) -> specialized. Succeeds.
        ...completeTier(2, {
          tier: 2,
          option: 'skills',
          target: { kind: 'skill', skill_id: 'smashing' },
        }),
        // tier 3: trains 'smashing' again -> already specialized. Fails (bad purchase #1).
        ...completeTier(3, {
          tier: 3,
          option: 'skills',
          target: { kind: 'skill', skill_id: 'smashing' },
        }),
        // tier 4: targets an ability the character doesn't know. Fails (bad purchase #2).
        ...completeTier(4, {
          tier: 4,
          option: 'skills',
          target: { kind: 'ability', ability_id: 'nonexistent-ability' },
        }),
      ],
    }

    const result = validateCharacterChoices(choices, content)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid result')

    expect(result.errors.some((e) => /already specialized/.test(e))).toBe(true)
    expect(result.errors.some((e) => /isn't among this character's known abilities/.test(e))).toBe(
      true,
    )
  })
})
