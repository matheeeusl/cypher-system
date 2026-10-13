import { describe, expect, it } from 'vitest'

import {
  getAllDescriptors,
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
        a.skill_grant && a.skill_grant.options !== 'any'
          ? a.skill_grant.options
              .filter((id) => !getSkillById(id))
              .map((id) => `ability "${a.id}" skill_grant -> "${id}"`)
          : [],
      ),
    ]
    expect(dangling).toEqual([])
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
