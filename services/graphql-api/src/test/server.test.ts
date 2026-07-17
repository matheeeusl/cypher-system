import { describe, expect, it } from 'vitest'

import { buildServer } from '../server.js'

describe('server', () => {
  it('routes a bare query through Yoga end to end', async () => {
    const app = buildServer()

    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: '{ __typename }' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ data: { __typename: 'Query' } })
  })
})
