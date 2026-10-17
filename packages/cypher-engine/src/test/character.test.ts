import { describe, expect, it } from 'vitest'
import type { Descriptor, Focus, Type } from '@cypher/content'

import { deriveCharacter } from '../character.js'
import type { CharacterChoices } from '../character/types.js'

// Real data from content/types/warrior.yaml.
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

// Real data from content/descriptors/strong.yaml.
const strong: Descriptor = {
  id: 'strong',
  name: { en: 'Strong', 'pt-BR': 'Forte' },
  description: { en: '', 'pt-BR': '' },
  pool_bonus: [{ stat: 'might', amount: 4 }],
  category: 'standard',
  pool_bonus_choice: null,
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

// data/foci/wields-two-weapons-at-once.yaml only has tier 1 shipped;
// tiers 2-3 here are the same inline fixture used in
// character-focus-abilities.test.ts, built from the Focus's real rulebook
// text (extracted during planning).
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

describe('deriveCharacter (Warrior, end-to-end)', () => {
  const choices: CharacterChoices = {
    type_id: 'warrior',
    descriptor_id: 'strong',
    focus_id: 'wields-two-weapons-at-once',
    starting_edge_choice: 'speed',
    pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
    tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'improved-edge'],
    focus_choice_selections: { '3': ['dual-medium-wield'] },
    descriptor_skill_choices: [],
    advancement_purchases: [
      // Tier 2, all 4 standard options.
      {
        tier: 2,
        option: 'increasing-capabilities',
        stat_pool_allocation: { might: 0, speed: 0, intellect: 4 },
      },
      { tier: 2, option: 'moving-toward-perfection', edge_stat: 'intellect' },
      { tier: 2, option: 'extra-effort' },
      { tier: 2, option: 'skills', target: { kind: 'skill', skill_id: 'perception' } },
      // Tier 3, all 4 standard options.
      {
        tier: 3,
        option: 'increasing-capabilities',
        stat_pool_allocation: { might: 0, speed: 4, intellect: 0 },
      },
      { tier: 3, option: 'moving-toward-perfection', edge_stat: 'speed' },
      { tier: 3, option: 'extra-effort' },
      { tier: 3, option: 'skills', target: { kind: 'ability', ability_id: 'bash' } },
    ],
  }

  const content = { type: warrior, descriptor: strong, focus: wieldsTwoWeapons }
  const derived = deriveCharacter(choices, content)

  it('reaches tier 3 (two completed tiers of standard advancements)', () => {
    expect(derived.tier).toBe(3)
  })

  it('derives final Pool maxes: base + allocation + descriptor bonus + advancement purchases', () => {
    // might: 10 + 2 (alloc) + 4 (descriptor) = 16
    // speed: 10 + 2 (alloc) + 4 (tier-3 purchase) = 16
    // intellect: 8 + 2 (alloc) + 4 (tier-2 purchase) = 14
    expect(derived.pools).toEqual({
      might: { max: 16 },
      speed: { max: 16 },
      intellect: { max: 14 },
    })
  })

  it('derives Edge: starting choice + moving-toward-perfection purchases', () => {
    // speed: 1 (starting) + 1 (tier-3 purchase) = 2; intellect: 1 (tier-2 purchase)
    expect(derived.edge).toEqual({ might: 0, speed: 2, intellect: 1 })
  })

  it('derives Effort: 1 base + 2 extra-effort purchases', () => {
    expect(derived.effort).toBe(3)
  })

  it('resolves known abilities from Type (tier-1 choices) and Focus (grants + tier-3 choice)', () => {
    const ids = derived.known_abilities.map((a) => a.ability_id).sort()
    expect(ids).toEqual(
      [
        'bash',
        'overwatch',
        'swipe',
        'improved-edge',
        'dual-light-wield',
        'double-strike',
        'infiltrator',
        'dual-medium-wield',
      ].sort(),
    )
  })

  it('marks the ability-training purchase target trained, others untouched', () => {
    expect(derived.known_abilities.find((a) => a.ability_id === 'bash')?.trained).toBe(true)
    expect(derived.known_abilities.find((a) => a.ability_id === 'overwatch')?.trained).toBe(false)
  })

  it('derives skills from Descriptor bonuses plus a skill-training purchase', () => {
    expect(derived.skills).toEqual({
      'breaking-inanimate-objects': { level: 'trained' },
      jumping: { level: 'trained' },
      perception: { level: 'trained' },
    })
  })
})

describe('deriveCharacter with Improved Edge', () => {
  const choices: CharacterChoices = {
    type_id: 'warrior',
    descriptor_id: 'strong',
    focus_id: 'wields-two-weapons-at-once',
    starting_edge_choice: 'speed',
    pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
    tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'improved-edge'],
    focus_choice_selections: {},
    descriptor_skill_choices: [],
    advancement_purchases: [],
  }
  const content = {
    type: warrior,
    descriptor: strong,
    focus: wieldsTwoWeapons,
    edge_grants: { 'improved-edge': { kind: 'choose_zero' as const } },
  }

  it('raises the picked Edge, keyed like a tier-1 Type skill grant', () => {
    const derived = deriveCharacter(
      { ...choices, ability_edge_choices: { 'type:1:improved-edge': 'might' } },
      content,
    )
    expect(derived.edge).toEqual({ might: 1, speed: 1, intellect: 0 })
    expect(derived.pending_picks).toEqual([])
  })

  it('leaves the pick pending until it is made', () => {
    expect(deriveCharacter(choices, content).pending_picks).toEqual([
      { kind: 'edge', tier: 1, key: 'type:1:improved-edge', ability_id: 'improved-edge' },
    ])
  })
})
