import { describe, expect, it } from 'vitest'

import {
  getAbilityById,
  getAllDescriptors,
  getAllFlavors,
  getAllTypes,
  getTypeById,
  getAllAbilities,
  getSkillById,
  loadEntities,
} from '../loader.js'
import { AbilitySchema } from '../schemas/ability.js'

describe('loader', () => {
  it('loads all 4 starter Types with the expected ids', () => {
    const types = getAllTypes()
    expect(types.map((t) => t.id).sort()).toEqual(['adept', 'explorer', 'speaker', 'warrior'])
  })

  it('resolves a known Type id and returns undefined for an unknown one', () => {
    expect(getTypeById('warrior')?.name.en).toBe('Warrior')
    expect(getTypeById('does-not-exist')).toBeUndefined()
  })

  // Pinned against the rulebook's "Choose N:" line under each
  // "TIER N <TYPE> ABILITIES" heading (chapter 4), tiers 1-6 in order.
  it("records each Type's per-tier ability choose counts from the rulebook", () => {
    const counts = Object.fromEntries(
      getAllTypes().map((t) => [
        t.id,
        Object.entries(t.tier_choose_counts)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, count]) => count),
      ]),
    )
    expect(counts).toEqual({
      adept: [4, 1, 2, 1, 2, 1],
      explorer: [4, 4, 3, 2, 3, 3],
      speaker: [4, 2, 3, 2, 3, 2],
      warrior: [4, 2, 3, 2, 3, 2],
    })
  })

  // The loader doesn't cross-check ids between categories, so a typo (or a
  // Skill that was never added) would otherwise only show up as a raw id on
  // the docs site. Reporting every dangling reference at once makes a bad
  // edit obvious in one run. See SKILLS-TRACKING.md for the history.
  it('resolves every skill id referenced by a Descriptor, Type or ability skill_grant to a registered Skill', () => {
    const dangling = [
      ...getAllDescriptors().flatMap((d) =>
        d.skill_training
          .filter((entry) => entry.skill_id !== null && !getSkillById(entry.skill_id))
          .map((entry) => `descriptor "${d.id}" -> "${entry.skill_id}"`),
      ),
      ...getAllTypes().flatMap((t) =>
        t.starting_skills
          .filter((id) => !getSkillById(id))
          .map((id) => `type "${t.id}" -> "${id}"`),
      ),
      ...getAllAbilities().flatMap((a) =>
        a.skill_grant && a.skill_grant.options !== 'noncombat'
          ? a.skill_grant.options
              .filter((id) => !getSkillById(id))
              .map((id) => `ability "${a.id}" skill_grant -> "${id}"`)
          : [],
      ),
    ]
    expect(dangling).toEqual([])
  })

  // A Flavor lists ability ids per tier, and each Ability records the flavors it
  // belongs to in `sources` (like Type/Focus abilities). The two sides are
  // authored separately, so check they agree in both directions.
  it('keeps every Flavor and its abilities in sync', () => {
    const problems: string[] = []
    for (const flavor of getAllFlavors()) {
      for (const [tier, ids] of Object.entries(flavor.tier_abilities)) {
        for (const id of ids) {
          const ability = getAbilityById(id)
          if (!ability) {
            problems.push(`flavor "${flavor.id}" tier ${tier} -> unknown ability "${id}"`)
          } else if (
            !ability.sources.some(
              (s) => s.type === 'flavor' && s.id === flavor.id && String(s.tier) === tier,
            )
          ) {
            problems.push(`ability "${id}" has no flavor source "${flavor.id}" at tier ${tier}`)
          }
        }
      }
    }
    for (const ability of getAllAbilities()) {
      for (const source of ability.sources.filter((s) => s.type === 'flavor')) {
        const flavor = getAllFlavors().find((f) => f.id === source.id)
        if (!flavor?.tier_abilities[String(source.tier)]?.includes(ability.id)) {
          problems.push(
            `ability "${ability.id}" source "${source.id}" tier ${source.tier} not listed by the flavor`,
          )
        }
      }
    }
    expect(problems).toEqual([])
  })

  // A choice ability lists the abilities it asks the player to pick; each of those
  // records the ability back as an `ability` source. Authored separately, so
  // check they agree in both directions, and that the engine's one-level
  // assumption holds (an option can't grant skills or hold a choice itself).
  it('keeps every choice ability and its options in sync', () => {
    const problems: string[] = []
    for (const ability of getAllAbilities()) {
      for (const optionId of ability.choice?.options ?? []) {
        const option = getAbilityById(optionId)
        if (!option) {
          problems.push(`ability "${ability.id}" choice -> unknown ability "${optionId}"`)
          continue
        }
        if (!option.sources.some((s) => s.type === 'ability' && s.id === ability.id)) {
          problems.push(`ability "${optionId}" has no "ability" source "${ability.id}"`)
        }
        if (option.skill_grant || option.choice) {
          problems.push(
            `ability "${optionId}" is an option of "${ability.id}" but has a skill_grant or choice`,
          )
        }
      }
      for (const source of ability.sources.filter((s) => s.type === 'ability')) {
        const owner = getAbilityById(source.id)
        if (!owner?.choice?.options.includes(ability.id)) {
          problems.push(
            `ability "${ability.id}" source "${source.id}" doesn’t list it as an option`,
          )
        }
      }
    }
    expect(problems).toEqual([])
  })

  // `choice.learn` lets a character buy more options later, but only through a
  // flavor that lists the ability; a learnable choice no flavor lists is unreachable.
  it('lists every learnable choice ability in at least one flavor', () => {
    const listed = new Set(
      getAllFlavors().flatMap((flavor) => Object.values(flavor.tier_abilities).flat()),
    )
    const unreachable = getAllAbilities()
      .filter((ability) => ability.choice?.learn && !listed.has(ability.id))
      .map((ability) => ability.id)
    expect(unreachable).toEqual([])
    expect(getAbilityById('cantrips')?.choice?.learn).toEqual({ xp_cost: 2, count: 2 })
  })

  it('attaches a non-empty, deterministic content_version to every entity', () => {
    const [first] = getAllAbilities()
    expect(first?.content_version).toBeTruthy()

    // Reloading the same category should produce identical hashes, since
    // content_version is derived purely from the file's parsed contents.
    const reloaded = loadEntities('abilities', AbilitySchema)
    for (const ability of getAllAbilities()) {
      expect(reloaded.get(ability.id)?.content_version).toBe(ability.content_version)
    }
  })

  it('fails loudly, naming the file, when content does not match its schema', () => {
    expect(() => loadEntities('__test-fixtures__/malformed', AbilitySchema)).toThrow(
      /__test-fixtures__\/malformed\/bad-ability\.yaml/,
    )
  })
})
