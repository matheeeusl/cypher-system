import { buildServer } from '../server.js'

export interface GraphQLTestResponse<TData> {
  data: TData
  errors?: Array<{ message: string }>
}

export async function graphqlRequest<TData = unknown>(
  doc: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLTestResponse<TData>> {
  const app = buildServer()
  const response = await app.inject({
    method: 'POST',
    url: '/graphql',
    payload: { query: doc, variables },
  })
  // response.json is generic (`<T = any>() => T`) — passing the type
  // argument here is the one place this boundary gets a real type, so every
  // call site gets a typed `data`/`errors` instead of `any` leaking through
  // the whole test suite.
  return response.json<GraphQLTestResponse<TData>>()
}
