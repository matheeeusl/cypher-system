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
  focus_choice_selections: { '3': ['dual-medium-wield'] },
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
      focus_choice_selections: { '3': ['not-a-real-option'] }, // invalid for tier 3's choice
    }

    const result = validateCharacterChoices(choices, content)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid result')

    expect(result.errors.some((e) => /sum to exactly 6/.test(e))).toBe(true)
    expect(result.errors.some((e) => /not a valid set of that tier's options/.test(e))).toBe(true)
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

describe('validateCharacterChoices with level-up picks', () => {
  it('is valid with outstanding picks, and lists them as pending', () => {
    const result = validateCharacterChoices(
      { ...validChoices, focus_choice_selections: {} },
      content,
    )
    if (!result.valid) throw new Error('expected valid')
    expect(result.character.pending_picks).toEqual([
      { kind: 'type', tier: 2, required: 2, chosen: 0 },
      { kind: 'type', tier: 3, required: 3, chosen: 0 },
      { kind: 'focus', tier: 3, required: 1, chosen: 0 },
    ])
  })

  it('adds made picks to the known abilities and clears them from pending', () => {
    const result = validateCharacterChoices(
      {
        ...validChoices,
        type_ability_picks: { '2': ['combat-prowess', 'quick-throw'], '3': ['a', 'b', 'c'] },
      },
      {
        ...content,
        type: {
          ...warrior,
          tier_abilities: { ...warrior.tier_abilities, '3': ['a', 'b', 'c'] },
        },
      },
    )
    if (!result.valid) throw new Error(result.errors.join('; '))
    expect(result.character.pending_picks).toEqual([])
    expect(result.character.known_abilities.map((a) => a.ability_id)).toEqual(
      expect.arrayContaining(['combat-prowess', 'quick-throw', 'a', 'b', 'c']),
    )
  })

  it('rejects a tier above the maximum', () => {
    const result = validateCharacterChoices(
      {
        ...validChoices,
        advancement_purchases: [
          ...validChoices.advancement_purchases,
          ...[4, 5, 6, 7].flatMap((tier) =>
            completeTier(tier, {
              tier,
              option: 'skills',
              target: { kind: 'skill', skill_id: `skill-${tier}` },
            }),
          ),
        ],
      },
      content,
    )
    if (result.valid) throw new Error('expected invalid')
    expect(result.issues.some((i) => i.code === 'TIER_TOO_HIGH')).toBe(true)
  })
})

describe('validateCharacterChoices with a flavor', () => {
  // Trimmed shape of content/flavors/stealth.yaml.
  const stealth = { id: 'stealth', tier_abilities: { '1': ['goad', 'legerdemain'] } }
  const flavored: CharacterChoices = {
    ...validChoices,
    flavor_id: 'stealth',
    tier_1_type_ability_ids: ['bash', 'goad', 'swipe', 'improved-edge'],
  }

  it('accepts flavor abilities among the tier-1 picks and sources them from the flavor', () => {
    const result = validateCharacterChoices(flavored, { ...content, flavor: stealth })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    const goad = result.character.known_abilities.find((a) => a.ability_id === 'goad')
    expect(goad?.source).toEqual({ kind: 'flavor', flavor_id: 'stealth' })
  })

  it('lets a Skills advancement train a flavor ability the character knows', () => {
    const choices: CharacterChoices = {
      ...flavored,
      advancement_purchases: completeTier(2, {
        tier: 2,
        option: 'skills',
        target: { kind: 'ability', ability_id: 'goad' },
      }),
    }
    expect(validateCharacterChoices(choices, { ...content, flavor: stealth }).valid).toBe(true)
  })

  it('reports a flavor abilities pick as unavailable when no flavor is chosen', () => {
    const result = validateCharacterChoices(
      { ...flavored, flavor_id: null },
      { ...content, flavor: stealth },
    )
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.issues.map((i) => i.code)).toContain('TYPE_ABILITY_UNAVAILABLE')
  })

  it('reports FLAVOR_UNKNOWN when the chosen flavor has no content', () => {
    const result = validateCharacterChoices(flavored, content)
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.issues[0]).toEqual({ code: 'FLAVOR_UNKNOWN', params: { flavorId: 'stealth' } })
  })
})

describe('validateCharacterChoices with a choice ability', () => {
  // A flavor offering Blessing of the Gods, which asks for 2 of its options.
  const magic = { id: 'magic', tier_abilities: { '1': ['blessing'] } }
  const ability_choices = { blessing: { options: ['war', 'sky', 'water'], count: 2 } }
  const base: CharacterChoices = {
    ...validChoices,
    flavor_id: 'magic',
    tier_1_type_ability_ids: ['bash', 'blessing', 'swipe', 'improved-edge'],
  }
  const withContent = { ...content, flavor: magic, ability_choices }

  it('adds the picked abilities to the known ones, credited to the flavor', () => {
    const result = validateCharacterChoices(
      { ...base, ability_choices: { 'type:1:blessing': ['war', 'sky'] } },
      withContent,
    )
    expect(result.valid).toBe(true)
    if (!result.valid) return
    const known = result.character.known_abilities
    expect(known.find((a) => a.ability_id === 'war')?.source).toEqual({
      kind: 'flavor',
      flavor_id: 'magic',
    })
    expect(known.map((a) => a.ability_id)).toEqual(expect.arrayContaining(['blessing', 'sky']))
    expect(result.character.pending_picks.filter((p) => p.kind === 'option')).toEqual([])
  })

  it('owes the picks as a pending choice, not an error, until they are made', () => {
    const result = validateCharacterChoices(base, withContent)
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.character.pending_picks.filter((p) => p.kind === 'option')).toEqual([
      {
        kind: 'option',
        tier: 1,
        key: 'type:1:blessing',
        ability_id: 'blessing',
        required: 2,
        chosen: 0,
      },
    ])
  })

  it('reports an option the ability does not offer, with a code to localize', () => {
    const result = validateCharacterChoices(
      { ...base, ability_choices: { 'type:1:blessing': ['war', 'fire'] } },
      withContent,
    )
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.issues).toContainEqual({
      code: 'ABILITY_CHOICE_INVALID',
      params: { abilityId: 'blessing', optionId: 'fire' },
    })
  })

  it('rejects picks when the caller supplied no choice definitions', () => {
    const result = validateCharacterChoices(
      { ...base, ability_choices: { 'type:1:blessing': ['war', 'sky'] } },
      { ...content, flavor: magic },
    )
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.issues.map((i) => i.code)).toContain('ABILITY_CHOICE_UNKNOWN')
  })
})
