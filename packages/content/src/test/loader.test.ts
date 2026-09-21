import { describe, expect, it } from 'vitest'

import { getAllTypes, getTypeById, getAllAbilities, loadEntities } from '../loader.js'
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
