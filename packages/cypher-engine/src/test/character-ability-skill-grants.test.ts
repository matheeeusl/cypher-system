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
  'life-lessons': { count: 2, options: 'any' as const },
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
    ).toThrow(/already trained/)
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
