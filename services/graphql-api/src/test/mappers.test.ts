import type { Focus } from '@cypher/content'
import { describe, expect, it } from 'vitest'

import { mapFocusTierAbilities } from '../resolvers/content/mappers.js'

describe('mapFocusTierAbilities', () => {
  it('maps a choice entry to ChoiceAbility with its two options', () => {
    // The current real content fixtures (packages/content/data/) don't
    // happen to include a Focus tier with a 'choice' entry — a real,
    // schema-legal shape that content-queries integration tests can't
    // exercise today. Covered here directly against the mapper function
    // instead, using a literal typed against the real @cypher/content type.
    const tierAbilities: Focus['tier_abilities'] = {
      '3': [{ kind: 'choice', options: ['dual-medium-wield', 'precise-cut'] }],
    }

    expect(mapFocusTierAbilities(tierAbilities)).toEqual([
      {
        tier: 3,
        entries: [{ __typename: 'ChoiceAbility', options: ['dual-medium-wield', 'precise-cut'] }],
      },
    ])
  })
})
