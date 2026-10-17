import { describe, expect, it } from 'vitest'
import type { Descriptor, Focus, Type } from '@cypher/content'

import { deriveCharacter, type CharacterContent } from '../character.js'
import { resolveAdvancementAbilities } from '../character/other-advancements.js'
import type { AdvancementPurchase, CharacterChoices } from '../character/types.js'
import { validateCharacterChoices } from '../validate-character-choices.js'

const warrior: Type = {
  id: 'warrior',
  name: { en: 'Warrior', 'pt-BR': 'Guerreiro' },
  tagline: { en: '', 'pt-BR': '' },
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
  starting_equipment: { clothing: true, weapon: null, items: [] },
  tier_choose_counts: { '1': 4, '2': 2, '3': 3, '4': 2, '5': 3, '6': 2 },
  tier_abilities: {
    '1': ['bash', 'overwatch', 'swipe', 'quick-throw', 'physical-skills', 'blessing'],
    '2': ['feint', 'reload'],
  },
}

const strong: Descriptor = {
  id: 'strong',
  name: { en: 'Strong', 'pt-BR': 'Forte' },
  description: { en: '', 'pt-BR': '' },
  pool_bonus: [{ stat: 'might', amount: 4 }],
  category: 'standard',
  pool_bonus_choice: null,
  characteristics: [],
  skill_training: [],
  inabilities: [],
  additional_equipment: null,
  connection_options: [],
}

const focus: Focus = {
  id: 'wields-two-weapons-at-once',
  name: { en: '', 'pt-BR': '' },
  description: { en: '', 'pt-BR': '' },
  tier_abilities: {
    '1': [{ kind: 'granted', ability_id: 'dual-light-wield' }],
    '2': [{ kind: 'granted', ability_id: 'double-strike' }],
    '3': [
      {
        kind: 'choice',
        options: ['dual-medium-wield', ['precise-cut', 'whirling-dervish']],
        count: 1,
      },
    ],
  },
  type_swap_option: null,
  additional_equipment: null,
  connection_options: null,
  minor_effect_suggestion: null,
  major_effect_suggestion: null,
}

const flavor = { id: 'stealth', tier_abilities: { '1': ['sneak'], '3': ['shadow-step'] } }

const content: CharacterContent = {
  type: warrior,
  descriptor: strong,
  focus,
  skill_grants: {
    'physical-skills': {
      count: 2,
      options: ['climbing', 'jumping', 'running', 'swimming'],
      repeatable: true,
    },
  },
  ability_choices: { blessing: { options: ['a', 'b', 'c'], count: 2 } },
}

/** Three standard purchases for `tier`; the fourth is the Other Option under test. */
function threeStandard(tier: number): AdvancementPurchase[] {
  return [
    {
      tier,
      option: 'increasing-capabilities',
      stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
    },
    { tier, option: 'moving-toward-perfection', edge_stat: 'might' },
    { tier, option: 'extra-effort' },
  ]
}

function choicesWith(purchases: AdvancementPurchase[], extra: Partial<CharacterChoices> = {}) {
  return {
    type_id: 'warrior',
    descriptor_id: 'strong',
    focus_id: focus.id,
    starting_edge_choice: 'might',
    pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
    tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'quick-throw'],
    focus_choice_selections: {},
    descriptor_skill_choices: [],
    advancement_purchases: purchases,
    ...extra,
  } satisfies CharacterChoices
}

const codesOf = (choices: CharacterChoices, c: CharacterContent = content) => {
  const result = validateCharacterChoices(choices, c)
  return result.valid ? [] : result.issues.map((i) => i.code)
}

describe('recovery and armor Other Options', () => {
  it('are 0 without any such purchase', () => {
    const derived = deriveCharacter(choicesWith([]), content)
    expect(derived.recovery_roll_bonus).toBe(0)
    expect(derived.armor_speed_cost_reduction).toBe(0)
  })

  it('add up once per tier, and close the tier in place of a standard advancement', () => {
    const derived = deriveCharacter(
      choicesWith([
        ...threeStandard(2),
        { tier: 2, option: 'recovery-roll-bonus' },
        ...threeStandard(3),
        { tier: 3, option: 'recovery-roll-bonus' },
        { tier: 4, option: 'reduce-armor-speed-cost' },
      ]),
      content,
    )
    expect(derived.tier).toBe(3)
    expect(derived.recovery_roll_bonus).toBe(4)
    // Applies as soon as bought, like every purchase.
    expect(derived.armor_speed_cost_reduction).toBe(1)
  })

  it('are in a valid validateCharacterChoices result too', () => {
    const result = validateCharacterChoices(
      choicesWith([...threeStandard(2), { tier: 2, option: 'reduce-armor-speed-cost' }]),
      content,
    )
    expect(result.valid && result.character.armor_speed_cost_reduction).toBe(1)
  })
})

describe('another Type ability', () => {
  it('becomes a known ability credited to the advancement', () => {
    const derived = deriveCharacter(
      choicesWith([{ tier: 2, option: 'type-ability', ability_id: 'blessing' }]),
      content,
    )
    expect(derived.known_abilities).toContainEqual({
      ability_id: 'blessing',
      source: { kind: 'advancement', tier: 2 },
      trained: false,
    })
  })

  it('comes from the tier the character has when buying, or lower', () => {
    // Tagged tier 2 = bought at tier 1: a tier-2 ability isn't available yet.
    expect(
      codesOf(choicesWith([{ tier: 2, option: 'type-ability', ability_id: 'feint' }])),
    ).toContain('ADVANCEMENT_ABILITY_NOT_OFFERED')
    // Tagged tier 3 = bought at tier 2: it is.
    expect(
      codesOf(
        choicesWith([
          ...threeStandard(2),
          { tier: 2, option: 'skills', target: { kind: 'skill', skill_id: 'climbing' } },
          { tier: 3, option: 'type-ability', ability_id: 'feint' },
        ]),
      ),
    ).toEqual([])
  })

  it("may come from the character's flavor", () => {
    const derived = deriveCharacter(
      choicesWith([{ tier: 2, option: 'type-ability', ability_id: 'sneak' }], {
        flavor_id: 'stealth',
      }),
      { ...content, flavor },
    )
    expect(derived.known_abilities.at(-1)?.ability_id).toBe('sneak')
  })

  it('refuses an ability the character already has', () => {
    expect(codesOf(choicesWith([{ tier: 2, option: 'type-ability', ability_id: 'bash' }]))).toEqual(
      ['ADVANCEMENT_ABILITY_KNOWN'],
    )
  })

  it('may retake a repeatable ability, whose skill picks get their own key', () => {
    const derived = deriveCharacter(
      choicesWith([{ tier: 2, option: 'type-ability', ability_id: 'physical-skills' }], {
        tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'physical-skills'],
        ability_skill_choices: { 'type:1:physical-skills': ['climbing', 'jumping'] },
      }),
      content,
    )
    expect(derived.pending_picks).toContainEqual(
      expect.objectContaining({ kind: 'skill', tier: 2, key: 'advancement:2:physical-skills' }),
    )

    const answered = deriveCharacter(
      choicesWith([{ tier: 2, option: 'type-ability', ability_id: 'physical-skills' }], {
        tier_1_type_ability_ids: ['bash', 'overwatch', 'swipe', 'physical-skills'],
        ability_skill_choices: {
          'type:1:physical-skills': ['climbing', 'jumping'],
          'advancement:2:physical-skills': ['running', 'swimming'],
        },
      }),
      content,
    )
    expect(answered.pending_picks).toEqual([])
    expect(answered.skills.running).toEqual({ level: 'trained' })
  })

  it("asks for a choice ability's options under an advancement key", () => {
    const derived = deriveCharacter(
      choicesWith([{ tier: 2, option: 'type-ability', ability_id: 'blessing' }], {
        ability_choices: { 'advancement:2:blessing': ['a', 'b'] },
      }),
      content,
    )
    expect(derived.known_abilities).toContainEqual({
      ability_id: 'a',
      source: { kind: 'advancement', tier: 2 },
      trained: false,
    })
  })
})

describe('second Focus choice', () => {
  // Tiers 2 and 3 done, so a purchase tagged 4 is bought at tier 3.
  const toTier3: AdvancementPurchase[] = [
    ...threeStandard(2),
    { tier: 2, option: 'skills', target: { kind: 'skill', skill_id: 'climbing' } },
    ...threeStandard(3),
    { tier: 3, option: 'skills', target: { kind: 'skill', skill_id: 'jumping' } },
  ]
  const picks = { type_ability_picks: { '2': ['feint', 'reload'], '3': ['blessing'] } }

  it('takes another option of a choice already made, a bundle counting as one', () => {
    const derived = deriveCharacter(
      choicesWith(
        [
          ...toTier3,
          { tier: 4, option: 'focus-ability', ability_ids: ['whirling-dervish', 'precise-cut'] },
        ],
        { ...picks, focus_choice_selections: { '3': ['dual-medium-wield'] } },
      ),
      content,
    )
    const bought = derived.known_abilities.filter((a) => a.source.kind === 'advancement')
    expect(bought.map((a) => a.ability_id)).toEqual(['whirling-dervish', 'precise-cut'])
  })

  it("needs that tier's first choice made", () => {
    expect(
      codesOf(
        choicesWith(
          [...toTier3, { tier: 4, option: 'focus-ability', ability_ids: ['dual-medium-wield'] }],
          picks,
        ),
      ),
    ).toContain('ADVANCEMENT_FOCUS_FIRST_CHOICE_MISSING')
  })

  it('refuses the option already chosen, part of a bundle, or a tier not reached', () => {
    const selected = { ...picks, focus_choice_selections: { '3': ['dual-medium-wield'] } }
    for (const ability_ids of [['dual-medium-wield'], ['precise-cut'], ['bash']]) {
      expect(
        codesOf(
          choicesWith([...toTier3, { tier: 4, option: 'focus-ability', ability_ids }], selected),
        ),
      ).toContain('ADVANCEMENT_FOCUS_OPTION_INVALID')
    }
    // Tagged tier 3 = bought at tier 2, below the tier-3 choice.
    expect(() =>
      resolveAdvancementAbilities(
        warrior,
        null,
        focus,
        [{ tier: 3, option: 'focus-ability', ability_ids: ['precise-cut', 'whirling-dervish'] }],
        { '3': ['dual-medium-wield'] },
        [],
      ),
    ).toThrow(/unchosen option of a Focus choice at or below tier 2/)
  })
})
