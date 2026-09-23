// Thin fetch wrapper around graphql-api — no codegen, no graphql-request
// dependency. GraphQL over HTTP is just a POST of { query, variables } that
// comes back as { data } or { errors }, so a generic helper is all a client
// component needs to call any query in lib/graphql/queries.ts.

const DEFAULT_ENDPOINT = 'http://localhost:4000/graphql'

export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    public readonly errors: ReadonlyArray<{ message: string }>,
  ) {
    super(message)
    this.name = 'GraphQLRequestError'
  }
}

interface GraphQLResponseBody<TData> {
  data?: TData
  errors?: Array<{ message: string }>
}

export async function gqlRequest<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(query: string, variables?: TVariables): Promise<TData> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_API_URL ?? DEFAULT_ENDPOINT

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const body = (await response.json()) as GraphQLResponseBody<TData>

  if (body.errors && body.errors.length > 0) {
    throw new GraphQLRequestError(body.errors.map((e) => e.message).join('; '), body.errors)
  }
  if (body.data === undefined) {
    throw new GraphQLRequestError('GraphQL response had no data', [])
  }

  return body.data
}
