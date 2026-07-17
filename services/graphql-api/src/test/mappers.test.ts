import type { EquipmentItem, Focus, WithVersion } from '@cypher/content'
import { describe, expect, it } from 'vitest'

import { mapEquipmentItem, mapFocusTierAbilities } from '../resolvers/content/mappers.js'

// The current real content fixtures (packages/content/content/) don't happen
// to include an EquipmentItem with no `stats` at all, or a Focus tier with a
// 'choice' entry — both are real, schema-legal shapes that content-queries
// integration tests can't exercise today. Covered here directly against the
// mapper functions instead, using literals typed against the real
// @cypher/content types.
describe('mapEquipmentItem', () => {
  it('maps a missing stats object to null, not an object of nulls', () => {
    const item: WithVersion<EquipmentItem> = {
      id: 'bare-item',
      name: { en: 'Bare Item', 'pt-BR': 'Item Simples' },
      description: { en: '', 'pt-BR': '' },
      category: 'gear',
      content_version: 'test',
    }

    expect(mapEquipmentItem(item).stats).toBeNull()
  })
})

describe('mapFocusTierAbilities', () => {
  it('maps a choice entry to ChoiceAbility with its two options', () => {
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
