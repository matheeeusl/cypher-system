import { describe, expect, it } from 'vitest'

import { getAllTypes, getTypeById, getAllAbilities, loadEntities } from '../loader'
import { AbilitySchema } from '../schemas/ability'

describe('loader', () => {
  it('loads all 4 starter Types with the expected ids', () => {
    const types = getAllTypes()
    expect(types.map((t) => t.id).sort()).toEqual(['adept', 'explorer', 'speaker', 'warrior'])
  })

  it('resolves a known Type id and returns undefined for an unknown one', () => {
    expect(getTypeById('warrior')?.name.en).toBe('Warrior')
    expect(getTypeById('does-not-exist')).toBeUndefined()
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
