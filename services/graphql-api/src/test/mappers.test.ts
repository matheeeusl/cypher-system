import type { Focus } from '@cypher/content'
import { describe, expect, it } from 'vitest'

import { mapFocusTierAbilities } from '../resolvers/content/mappers.js'

describe('mapFocusTierAbilities', () => {
  it('maps a choice entry to ChoiceAbility, wrapping each single-ability option as a 1-element list', () => {
    const tierAbilities: Focus['tier_abilities'] = {
      '3': [{ kind: 'choice', options: ['dual-medium-wield', 'precise-cut'], count: 1 }],
    }

    expect(mapFocusTierAbilities(tierAbilities)).toEqual([
      {
        tier: 3,
        entries: [
          {
            __typename: 'ChoiceAbility',
            options: [['dual-medium-wield'], ['precise-cut']],
            count: 1,
          },
        ],
      },
    ])
  })

  it('leaves a bundled-pair option (a "choose either X, or both Y and Z" entry) as its own list', () => {
    // Real example: Transmits Energy, tier 6 — "Choose either Explosive
    // Release, or both Continuous Transfer and Drain at a Distance."
    const tierAbilities: Focus['tier_abilities'] = {
      '6': [
        {
          kind: 'choice',
          options: ['explosive-release', ['continuous-transfer', 'drain-at-a-distance']],
          count: 1,
        },
      ],
    }

    expect(mapFocusTierAbilities(tierAbilities)).toEqual([
      {
        tier: 6,
        entries: [
          {
            __typename: 'ChoiceAbility',
            options: [['explosive-release'], ['continuous-transfer', 'drain-at-a-distance']],
            count: 1,
          },
        ],
      },
    ])
  })
})
