import { ActionTypeSchema } from '@cypher/content'
import { isEnumType } from 'graphql'
import { describe, expect, it } from 'vitest'

import { buildSchema } from '../schema/index.js'
import { enumResolvers } from '../resolvers/content/enums.js'

describe('ActionType enum', () => {
  it('covers every action type the content schema allows, and nothing else', () => {
    const type = buildSchema().getType('ActionType')
    if (!isEnumType(type)) throw new Error('ActionType is not an enum')
    const names = type.getValues().map((v) => v.name)
    expect(names.sort()).toEqual(ActionTypeSchema.options.map((o) => o.toUpperCase()).sort())
  })

  it('maps each name to its content value', () => {
    for (const [name, value] of Object.entries(enumResolvers.ActionType)) {
      expect(name).toBe(value.toUpperCase())
    }
    expect(Object.values(enumResolvers.ActionType).sort()).toEqual(
      [...ActionTypeSchema.options].sort(),
    )
  })
})
