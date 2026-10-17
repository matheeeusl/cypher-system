import { describe, expect, it } from 'vitest'
import type { Descriptor, Focus, Type } from '@cypher/content'

import { deriveCharacter } from '../character.js'
import {
  applyAbilitySkillGrants,
  collectSkillGrantInstances,
  skillGrantKey,
} from '../character/ability-skill-grants.js'
import { resolveTypeTierPicks } from '../character/type-abilities.js'
import type { CharacterChoices, PendingPick } from '../character/types.js'
import { validateCharacterChoices } from '../validate-character-choices.js'

const grants = {
  'physical-skills': {
    count: 2,
    options: ['climbing', 'jumping', 'running', 'swimming'],
  },
  'life-lessons': { count: 2, options: 'noncombat' as const },
}

const noPicks = { type_ability_picks: {}, focus_choice_selections: {} }

describe('collectSkillGrantInstances', () => {
  it('lists tier-1 Type picks, later-tier picks and Focus grants once per time they were gained', () => {
    const instances = collectSkillGrantInstances(
      { special_ability_id: null },
      {
        tier_abilities: {
          '1': [{ kind: 'granted', ability_id: 'life-lessons' }],
          '4': [{ kind: 'granted', ability_id: 'life-lessons' }],
        },
      },
      4,
      {
        tier_1_type_ability_ids: ['physical-skills', 'bash'],
        type_ability_picks: { '3': ['physical-skills'] },
        focus_choice_selections: {},
      },
      grants,
    )
    expect(instances.map((i) => i.key)).toEqual([
      'type:1:physical-skills',
      'focus:1:life-lessons',
      'type:3:physical-skills',
      'focus:4:life-lessons',
    ])
  })

  it('skips Focus tiers the character has not reached', () => {
    const instances = collectSkillGrantInstances(
      { special_ability_id: null },
      { tier_abilities: { '4': [{ kind: 'granted', ability_id: 'life-lessons' }] } },
      2,
      { tier_1_type_ability_ids: [], ...noPicks },
      grants,
    )
    expect(instances).toEqual([])
  })
})

describe('applyAbilitySkillGrants', () => {
  const physical = collectSkillGrantInstances(
    { special_ability_id: null },
    { tier_abilities: {} },
    1,
    { tier_1_type_ability_ids: ['physical-skills'], ...noPicks },
    grants,
  )
  const key = skillGrantKey('type', 1, 'physical-skills')

  it('trains the chosen skills', () => {
    const skills = applyAbilitySkillGrants(
      physical,
      { [key]: ['climbing', 'swimming'] },
      { jumping: { level: 'trained' } },
      [],
    )
    expect(skills).toEqual({
      jumping: { level: 'trained' },
      climbing: { level: 'trained' },
      swimming: { level: 'trained' },
    })
  })

  it('reports an incomplete tier-1 grant as pending, applying what was picked', () => {
    const pending: PendingPick[] = []
    const skills = applyAbilitySkillGrants(physical, { [key]: ['climbing'] }, {}, pending)
    expect(skills).toEqual({ climbing: { level: 'trained' } })
    expect(pending).toEqual([
      { kind: 'skill', tier: 1, key, ability_id: 'physical-skills', required: 2, chosen: 1 },
    ])
  })

  it('rejects more skills than the ability grants', () => {
    expect(() =>
      applyAbilitySkillGrants(physical, { [key]: ['climbing', 'jumping', 'running'] }, {}, []),
    ).toThrow(/grants only 2/)
  })

  it('rejects a skill outside the ability options', () => {
    expect(() =>
      applyAbilitySkillGrants(physical, { [key]: ['climbing', 'perception'] }, {}, []),
    ).toThrow(/not one of the skills/)
  })

  it('rejects a combat skill for a noncombat grant, and allows others', () => {
    const lessons = collectSkillGrantInstances(
      { special_ability_id: null },
      { tier_abilities: {} },
      1,
      { tier_1_type_ability_ids: ['life-lessons'], ...noPicks },
      grants,
    )
    const lessonsKey = skillGrantKey('type', 1, 'life-lessons')
    const combat = new Set(['might-defense'])
    expect(() =>
      applyAbilitySkillGrants(
        lessons,
        { [lessonsKey]: ['perception', 'might-defense'] },
        {},
        [],
        combat,
      ),
    ).toThrow(/not one of the skills/)
    const skills = applyAbilitySkillGrants(
      lessons,
      { [lessonsKey]: ['perception', 'history'] },
      {},
      [],
      combat,
    )
    expect(Object.keys(skills)).toEqual(['perception', 'history'])
  })

  it('rejects a skill the character is already trained in', () => {
    expect(() =>
      applyAbilitySkillGrants(
        physical,
        { [key]: ['climbing', 'jumping'] },
        { jumping: { level: 'trained' } },
        [],
      ),
    ).toThrow(/already trained/)
  })

  it('accepts a practiced or inability skill (it is not trained yet)', () => {
    const skills = applyAbilitySkillGrants(
      physical,
      { [key]: ['climbing', 'jumping'] },
      { jumping: { level: 'inability' } },
      [],
    )
    expect(skills['jumping']).toEqual({ level: 'trained' })
  })

  it('rejects the same skill picked by two instances of the ability', () => {
    const twice = collectSkillGrantInstances(
      { special_ability_id: null },
      { tier_abilities: {} },
      2,
      {
        tier_1_type_ability_ids: ['physical-skills'],
        type_ability_picks: { '2': ['physical-skills'] },
        focus_choice_selections: {},
      },
      grants,
    )
    expect(() =>
      applyAbilitySkillGrants(
        twice,
        {
          'type:1:physical-skills': ['climbing', 'jumping'],
          'type:2:physical-skills': ['running', 'jumping'],
        },
        {},
        [],
      ),
    ).toThrow(/more than once for the same ability/)
  })

  it('reports an unfinished tier-2+ grant as pending instead of failing', () => {
    const twice = collectSkillGrantInstances(
      { special_ability_id: null },
      { tier_abilities: {} },
      2,
      {
        tier_1_type_ability_ids: ['physical-skills'],
        type_ability_picks: { '2': ['physical-skills'] },
        focus_choice_selections: {},
      },
      grants,
    )
    const pending: PendingPick[] = []
    const skills = applyAbilitySkillGrants(
      twice,
      { 'type:1:physical-skills': ['climbing', 'jumping'], 'type:2:physical-skills': ['running'] },
      {},
      pending,
    )
    expect(skills['running']).toEqual({ level: 'trained' })
    expect(pending).toEqual([
      {
        kind: 'skill',
        tier: 2,
        key: 'type:2:physical-skills',
        ability_id: 'physical-skills',
        required: 2,
        chosen: 1,
      },
    ])
  })

  it('rejects a choice entry that matches no instance', () => {
    expect(() =>
      applyAbilitySkillGrants(
        physical,
        { [key]: ['climbing', 'jumping'], 'type:9:nope': ['x'] },
        {},
        [],
      ),
    ).toThrow(/matches no skill-granting ability/)
  })
})

describe('resolveTypeTierPicks with repeatable abilities', () => {
  const type = {
    id: 'warrior',
    tier_abilities: { '1': ['physical-skills', 'bash'], '2': ['swipe'] },
    tier_choose_counts: { '1': 4, '2': 2 },
  } as Pick<Type, 'id' | 'tier_abilities' | 'tier_choose_counts'>

  it('rejects retaking an ability that is not repeatable', () => {
    expect(() => resolveTypeTierPicks(type, 2, { '2': ['bash', 'swipe'] }, ['bash'], [])).toThrow(
      /more than once/,
    )
  })

  it('allows retaking a repeatable ability at a later tier', () => {
    const picked = resolveTypeTierPicks(
      type,
      2,
      { '2': ['physical-skills', 'swipe'] },
      ['physical-skills'],
      [],
      new Set(['physical-skills']),
    )
    expect(picked.map((a) => a.ability_id)).toEqual(['physical-skills', 'swipe'])
  })

  it('still rejects the same repeatable ability twice within one tier', () => {
    expect(() =>
      resolveTypeTierPicks(
        type,
        2,
        { '2': ['physical-skills', 'physical-skills'] },
        [],
        [],
        new Set(['physical-skills']),
      ),
    ).toThrow(/more than once/)
  })
})

describe('deriveCharacter / validateCharacterChoices with skill grants', () => {
  // Minimal fixtures: only the fields the engine reads for these rules.
  const type = {
    id: 'warrior',
    starting_pools: { might: 10, speed: 10, intellect: 8 },
    starting_edge: { stat_choices: ['might'], amount: 1 },
    special_ability_id: null,
    tier_choose_counts: { '1': 4, '2': 2 },
    tier_abilities: {
      '1': ['physical-skills', 'bash', 'swipe', 'overwatch', 'quick-throw'],
      '2': ['combat-prowess'],
    },
  } as unknown as Type
  const descriptor = {
    id: 'strong',
    pool_bonus: [],
    category: 'standard',
    pool_bonus_choice: null,
    skill_training: [{ skill_id: 'jumping', choice_count: null }],
  } as unknown as Descriptor
  const focus = { id: 'f', tier_abilities: {} } as unknown as Focus
  const content = { type, descriptor, focus, skill_grants: grants }

  const base: CharacterChoices = {
    type_id: 'warrior',
    descriptor_id: 'strong',
    focus_id: 'f',
    pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
    tier_1_type_ability_ids: ['physical-skills', 'bash', 'swipe', 'overwatch'],
    focus_choice_selections: {},
    descriptor_skill_choices: [],
    advancement_purchases: [],
    ability_skill_choices: { 'type:1:physical-skills': ['climbing', 'swimming'] },
  }

  it('merges the picks with the Descriptor skills', () => {
    const derived = deriveCharacter(base, content)
    expect(derived.skills).toEqual({
      jumping: { level: 'trained' },
      climbing: { level: 'trained' },
      swimming: { level: 'trained' },
    })
  })

  it('lists a missing tier-1 pick as pending instead of invalidating the character', () => {
    const result = validateCharacterChoices({ ...base, ability_skill_choices: {} }, content)
    if (!result.valid) throw new Error(result.errors.join('; '))
    expect(result.character.pending_picks).toEqual([
      {
        kind: 'skill',
        tier: 1,
        key: 'type:1:physical-skills',
        ability_id: 'physical-skills',
        required: 2,
        chosen: 0,
      },
    ])
  })

  it('treats a character without skill_grants content as having no grants', () => {
    const result = validateCharacterChoices(base, { type, descriptor, focus })
    if (result.valid) throw new Error('expected invalid')
    expect(result.issues.map((i) => i.code)).toEqual(['ABILITY_SKILL_CHOICE_UNKNOWN'])
  })
})

describe('skill grant modes', () => {
  const grantsByMode = {
    'skill-with-defense': {
      count: 1,
      options: ['might-defense', 'speed-defense'],
    },
    'greater-skill-with-defense': {
      count: 1,
      options: ['might-defense', 'speed-defense'],
      mode: 'train_or_specialize' as const,
      repeatable: true,
    },
    'mastery-with-defense': {
      count: 1,
      options: ['might-defense', 'speed-defense'],
      mode: 'specialize' as const,
      repeatable: true,
    },
  }
  const at = (ability: string) =>
    collectSkillGrantInstances(
      { special_ability_id: null },
      { tier_abilities: {} },
      1,
      { tier_1_type_ability_ids: [ability], ...noPicks },
      grantsByMode,
    )
  const key = (ability: string) => skillGrantKey('type', 1, ability)

  it("'train_or_specialize' trains a new skill and specializes a trained one", () => {
    const inst = at('greater-skill-with-defense')
    const k = key('greater-skill-with-defense')
    expect(applyAbilitySkillGrants(inst, { [k]: ['might-defense'] }, {}, [])).toEqual({
      'might-defense': { level: 'trained' },
    })
    expect(
      applyAbilitySkillGrants(
        inst,
        { [k]: ['might-defense'] },
        { 'might-defense': { level: 'trained' } },
        [],
      ),
    ).toEqual({ 'might-defense': { level: 'specialized' } })
  })

  it("'train_or_specialize' refuses an already specialized skill", () => {
    const k = key('greater-skill-with-defense')
    expect(() =>
      applyAbilitySkillGrants(
        at('greater-skill-with-defense'),
        { [k]: ['might-defense'] },
        { 'might-defense': { level: 'specialized' } },
        [],
      ),
    ).toThrow(/already specialized/)
  })

  it("'specialize' needs a trained skill", () => {
    const k = key('mastery-with-defense')
    expect(() =>
      applyAbilitySkillGrants(at('mastery-with-defense'), { [k]: ['might-defense'] }, {}, []),
    ).toThrow(/already trained in/)
    expect(
      applyAbilitySkillGrants(
        at('mastery-with-defense'),
        { [k]: ['might-defense'] },
        { 'might-defense': { level: 'trained' } },
        [],
      ),
    ).toEqual({ 'might-defense': { level: 'specialized' } })
  })

  it("'train' still refuses a skill the character is trained in", () => {
    const k = key('skill-with-defense')
    expect(() =>
      applyAbilitySkillGrants(
        at('skill-with-defense'),
        { [k]: ['might-defense'] },
        { 'might-defense': { level: 'trained' } },
        [],
      ),
    ).toThrow(/already trained/)
  })

  it('refuses the same skill twice within one ability, even when specializing', () => {
    const inst = collectSkillGrantInstances(
      { special_ability_id: null },
      { tier_abilities: {} },
      2,
      {
        tier_1_type_ability_ids: ['greater-skill-with-defense'],
        type_ability_picks: { '2': ['greater-skill-with-defense'] },
        focus_choice_selections: {},
      },
      grantsByMode,
    )
    expect(() =>
      applyAbilitySkillGrants(
        inst,
        {
          'type:1:greater-skill-with-defense': ['might-defense'],
          'type:2:greater-skill-with-defense': ['might-defense'],
        },
        {},
        [],
      ),
    ).toThrow(/more than once for the same ability/)
  })
})

describe('skill grants and advancement purchases', () => {
  const type = {
    id: 'warrior',
    starting_pools: { might: 10, speed: 10, intellect: 8 },
    starting_edge: { stat_choices: ['might'], amount: 1 },
    special_ability_id: null,
    tier_choose_counts: { '1': 4, '2': 2 },
    tier_abilities: {
      '1': ['bash', 'swipe', 'overwatch', 'quick-throw'],
      '2': ['mastery-with-defense'],
    },
  } as unknown as Type
  const descriptor = {
    id: 'strong',
    pool_bonus: [],
    category: 'standard',
    pool_bonus_choice: null,
    skill_training: [],
  } as unknown as Descriptor
  const focus = { id: 'f', tier_abilities: {} } as unknown as Focus
  const content = {
    type,
    descriptor,
    focus,
    skill_grants: {
      'mastery-with-defense': {
        count: 1,
        options: ['might-defense'],
        mode: 'specialize' as const,
        repeatable: true,
      },
    },
  }
  const tier2 = (skill: string): CharacterChoices['advancement_purchases'] => [
    {
      tier: 2,
      option: 'increasing-capabilities',
      stat_pool_allocation: { might: 4, speed: 0, intellect: 0 },
    },
    { tier: 2, option: 'moving-toward-perfection', edge_stat: 'might' },
    { tier: 2, option: 'extra-effort' },
    { tier: 2, option: 'skills', target: { kind: 'skill', skill_id: skill } },
  ]
  const base: CharacterChoices = {
    type_id: 'warrior',
    descriptor_id: 'strong',
    focus_id: 'f',
    pool_point_allocation: { might: 2, speed: 2, intellect: 2 },
    tier_1_type_ability_ids: ['bash', 'swipe', 'overwatch', 'quick-throw'],
    focus_choice_selections: {},
    descriptor_skill_choices: [],
    advancement_purchases: tier2('might-defense'),
    type_ability_picks: { '2': ['mastery-with-defense'] },
    ability_skill_choices: { 'type:2:mastery-with-defense': ['might-defense'] },
  }

  it('lets a tier-2 pick specialize a skill trained by a purchase tagged tier 2', () => {
    const result = validateCharacterChoices(base, content)
    if (!result.valid) throw new Error(result.errors.join('; '))
    expect(result.character.skills['might-defense']).toEqual({ level: 'specialized' })
    expect(deriveCharacter(base, content).skills['might-defense']).toEqual({
      level: 'specialized',
    })
  })

  it('refuses specializing a skill nothing has trained', () => {
    const result = validateCharacterChoices(
      { ...base, advancement_purchases: tier2('perception') },
      content,
    )
    if (result.valid) throw new Error('expected invalid')
    expect(result.issues.map((i) => i.code)).toContain('ABILITY_SKILL_CHOICE_NOT_TRAINED')
  })
})

describe('skill grants with an alternate shape', () => {
  const learned = {
    'learned-a-few-things': {
      count: 2,
      options: 'noncombat' as const,
      alternate: { count: 1, mode: 'specialize' as const },
    },
  }
  const instances = collectSkillGrantInstances(
    { special_ability_id: null },
    { tier_abilities: {} },
    1,
    { tier_1_type_ability_ids: ['learned-a-few-things'], ...noPicks },
    learned,
  )
  const key = 'type:1:learned-a-few-things'

  it('trains two skills', () => {
    expect(applyAbilitySkillGrants(instances, { [key]: ['history', 'geography'] }, {}, [])).toEqual(
      { history: { level: 'trained' }, geography: { level: 'trained' } },
    )
  })

  it('or specializes one that is already trained', () => {
    expect(
      applyAbilitySkillGrants(
        instances,
        { [key]: ['history'] },
        { history: { level: 'trained' } },
        [],
      ),
    ).toEqual({ history: { level: 'specialized' } })
  })

  it('refuses specializing a skill that is not trained', () => {
    expect(() => applyAbilitySkillGrants(instances, { [key]: ['history'] }, {}, [])).toThrow(
      /already trained in/,
    )
  })

  it('is pending, with the alternate count, until one of the shapes is complete', () => {
    const pending: PendingPick[] = []
    applyAbilitySkillGrants(instances, {}, {}, pending)
    expect(pending).toEqual([
      {
        kind: 'skill',
        tier: 1,
        key,
        ability_id: 'learned-a-few-things',
        required: 2,
        chosen: 0,
        alternate_required: 1,
      },
    ])
  })

  it('refuses more picks than the larger shape', () => {
    expect(() => applyAbilitySkillGrants(instances, { [key]: ['a', 'b', 'c'] }, {}, [])).toThrow(
      /grants only 2/,
    )
  })
})

describe('custom (typed) skills', () => {
  const grants = {
    'celebrity-talent': { count: 2, options: 'noncombat' as const, allow_custom: true },
    'life-lessons': { count: 1, options: 'noncombat' as const },
    'greater-talent': {
      count: 1,
      options: 'noncombat' as const,
      allow_custom: true,
      mode: 'train_or_specialize' as const,
      repeatable: true,
    },
  }
  const at = (ability: string) =>
    collectSkillGrantInstances(
      { special_ability_id: null },
      { tier_abilities: {} },
      1,
      { tier_1_type_ability_ids: [ability], ...noPicks },
      grants,
    )

  it('trains a typed skill next to a catalog one', () => {
    const skills = applyAbilitySkillGrants(
      at('celebrity-talent'),
      { 'type:1:celebrity-talent': ['custom:Chess', 'history'] },
      {},
      [],
    )
    expect(skills).toEqual({ 'custom:Chess': { level: 'trained' }, history: { level: 'trained' } })
  })

  it('refuses a typed skill when the ability does not allow one', () => {
    expect(() =>
      applyAbilitySkillGrants(
        at('life-lessons'),
        { 'type:1:life-lessons': ['custom:Chess'] },
        {},
        [],
      ),
    ).toThrow(/not one of the skills/)
  })

  it('refuses an empty or over-long typed skill', () => {
    const key = { 'type:1:celebrity-talent': ['custom:   ', 'history'] }
    expect(() => applyAbilitySkillGrants(at('celebrity-talent'), key, {}, [])).toThrow(
      /not one of the skills/,
    )
    expect(() =>
      applyAbilitySkillGrants(
        at('celebrity-talent'),
        { 'type:1:celebrity-talent': [`custom:${'x'.repeat(61)}`, 'history'] },
        {},
        [],
      ),
    ).toThrow(/not one of the skills/)
  })

  it('compares typed skills ignoring case and spacing', () => {
    expect(() =>
      applyAbilitySkillGrants(
        at('celebrity-talent'),
        { 'type:1:celebrity-talent': ['custom:Chess', 'custom:  chess '] },
        {},
        [],
      ),
    ).toThrow(/more than once for the same ability/)
    expect(() =>
      applyAbilitySkillGrants(
        at('celebrity-talent'),
        { 'type:1:celebrity-talent': ['custom:chess', 'history'] },
        { 'custom:Chess': { level: 'trained' } },
        [],
      ),
    ).toThrow(/already trained/)
  })

  it('specializes a typed skill the character already has, keeping its entry', () => {
    const skills = applyAbilitySkillGrants(
      at('greater-talent'),
      { 'type:1:greater-talent': ['custom:chess'] },
      { 'custom:Chess': { level: 'trained' } },
      [],
    )
    expect(skills).toEqual({ 'custom:Chess': { level: 'specialized' } })
  })
})
