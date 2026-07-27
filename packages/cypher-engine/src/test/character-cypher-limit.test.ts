import { describe, expect, it } from 'vitest'

import { getCypherLimit } from '../character/cypher-limit.js'

describe('getCypherLimit', () => {
  it('is 2 for a Type with no special ability', () => {
    expect(getCypherLimit({ special_ability_id: null })).toBe(2)
  })

  it('is 2 for a Type whose special ability is not Expert Cypher Use', () => {
    expect(getCypherLimit({ special_ability_id: 'some-other-ability' })).toBe(2)
  })

  it('is 3 for the Adept (special ability is expert-cypher-use)', () => {
    expect(getCypherLimit({ special_ability_id: 'expert-cypher-use' })).toBe(3)
  })
})
