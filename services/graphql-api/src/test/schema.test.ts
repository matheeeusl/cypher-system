import { validateSchema } from 'graphql'
import { describe, expect, it } from 'vitest'

import { buildSchema } from '../schema/index.js'

describe('schema', () => {
  it('parses and validates with no errors, including both @oneOf inputs', () => {
    const schema = buildSchema()
    const errors = validateSchema(schema)
    expect(errors).toEqual([])
  })
})
