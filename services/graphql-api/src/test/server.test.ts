import { describe, expect, it } from 'vitest'

import { buildServer } from '../build-server.js'

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

  it('marks GET responses cacheable for the CDN', async () => {
    const app = buildServer()

    const response = await app.inject({
      method: 'GET',
      url: '/graphql?query=' + encodeURIComponent('{ __typename }'),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ data: { __typename: 'Query' } })
    expect(response.headers['cache-control']).toContain('s-maxage=')
  })

  it('leaves POST responses uncached', async () => {
    const app = buildServer()

    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: '{ __typename }' },
    })

    expect(response.headers['cache-control']).toBeUndefined()
  })
})
