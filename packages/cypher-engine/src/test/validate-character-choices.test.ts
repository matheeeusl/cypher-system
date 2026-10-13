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
  starting_equipment: {
    clothing: true,
    weapon: { en: 'two weapons of your choice', 'pt-BR': 'Tradução em breve.' },
    items: [
      { price_tier: 'expensive', count: 1, exact: true },
      { price_tier: 'moderately_priced', count: 2, exact: true },
      { price_tier: 'inexpensive', count: 4, exact: false },
    ],
  },
  tier_choose_counts: { '1': 4, '2': 2, '3': 3, '4': 2, '5': 3, '6': 2 },
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
  pool_bonus: [{ stat: 'might', amount: 4 }],
  characteristics: [],
  skill_training: [
    { skill_id: 'breaking-inanimate-objects', choice_count: null },
    { skill_id: 'jumping', choice_count: null },
  ],
  inabilities: [],
  additional_equipment: { en: 'You have an extra medium weapon or heavy weapon.', 'pt-BR': '' },
  connection_options: [
    { en: '', 'pt-BR': '' },
    { en: '', 'pt-BR': '' },
    { en: '', 'pt-BR': '' },
    { en: '', 'pt-BR': '' },
  ],
}

const wieldsTwoWeapons: Focus = {
  id: 'wields-two-weapons-at-once',
  name: { en: 'Wields Two Weapons at Once', 'pt-BR': '' },
  description: { en: 'You bear steel with both hands, ready to take on any foe.', 'pt-BR': '' },
  tier_abilities: {
    '1': [{ kind: 'granted', ability_id: 'dual-light-wield' }],
    '2': [
      { kind: 'granted', ability_id: 'double-strike' },
      { kind: 'granted', ability_id: 'infiltrator' },
    ],
    '3': [{ kind: 'choice', options: ['dual-medium-wield', 'precise-cut'], count: 1 }],
  },
  type_swap_option: null,
  additional_equipment: null,
  connection_options: null,
  minor_effect_suggestion: null,
  major_effect_suggestion: null,
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
  descriptor_skill_choices: [],
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
      // Incomplete tier 2 (only 3 of the 4 standard advancements) while tier 3
      // already has purchases -> deriveTier throws.
      advancement_purchases: [
        ...completeTier(2, {
          tier: 2,
          option: 'skills',
          target: { kind: 'skill', skill_id: 'perception' },
        }).slice(0, 3),
        ...completeTier(3, {
          tier: 3,
          option: 'skills',
          target: { kind: 'skill', skill_id: 'perception' },
        }),
      ],
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

  it('blocks skill-target purchase validation when descriptor skill-choice resolution fails, without a spurious skill error', () => {
    const strongWithChoice: Descriptor = {
      ...strong,
      skill_training: [...strong.skill_training, { skill_id: null, choice_count: 1 }],
    }
    const choices: CharacterChoices = {
      ...validChoices,
      // strongWithChoice requires exactly 1 choice; none supplied ->
      // applyDescriptorSkills throws.
      descriptor_skill_choices: [],
    }

    const result = validateCharacterChoices(choices, { ...content, descriptor: strongWithChoice })
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid result')

    expect(result.errors.some((e) => /Exactly 1 descriptor_skill_choices/.test(e))).toBe(true)
    // validChoices' tier-2/3 skill-target purchases (training 'perception')
    // were skipped rather than throwing a second, confusing error about a
    // skill map that was never built.
    expect(result.errors.filter((e) => /descriptor_skill_choices/.test(e))).toHaveLength(1)
  })

  it('reports every independently-bad advancement purchase, not just the first', () => {
    const choices: CharacterChoices = {
      ...validChoices,
      advancement_purchases: [
        // tier 2: trains 'breaking-inanimate-objects' (already trained via
        // Strong) -> specialized. Succeeds.
        ...completeTier(2, {
          tier: 2,
          option: 'skills',
          target: { kind: 'skill', skill_id: 'breaking-inanimate-objects' },
        }),
        // tier 3: trains it again -> already specialized. Fails (bad purchase #1).
        ...completeTier(3, {
          tier: 3,
          option: 'skills',
          target: { kind: 'skill', skill_id: 'breaking-inanimate-objects' },
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

describe('validateCharacterChoices with a partly bought tier', () => {
  it('is valid: partial progress toward the next tier keeps the current tier and applies the purchases', () => {
    const partial: CharacterChoices = {
      ...validChoices,
      focus_choice_selections: {},
      advancement_purchases: [{ tier: 2, option: 'extra-effort' }],
    }
    const result = validateCharacterChoices(partial, content)
    expect(result.valid).toBe(true)
    if (!result.valid) throw new Error('expected valid')
    expect(result.character.tier).toBe(1)
    expect(result.character.effort).toBe(2)
  })
})

describe('validateCharacterChoices issues', () => {
  it('reports a machine-readable code and params alongside every English error', () => {
    const result = validateCharacterChoices(
      { ...validChoices, pool_point_allocation: { might: 3, speed: 3, intellect: 3 } },
      content,
    )
    if (result.valid) throw new Error('expected invalid')
    expect(result.issues).toHaveLength(result.errors.length)
    expect(result.issues).toContainEqual({
      code: 'POOL_ALLOCATION_SUM',
      params: { label: 'pool_point_allocation', expected: 6, actual: 9 },
    })
  })
})
