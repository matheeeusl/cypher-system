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

/**
 * `GET` puts the query in the URL so graphql-api's response can be cached
 * (by Vercel's CDN and the browser) — use it for rules-content reads. Keep
 * `POST` for queries with large variables (validateCharacterChoices), which
 * would make long, never-repeated URLs.
 */
export async function gqlRequest<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(
  query: string,
  variables?: TVariables,
  { method = 'POST' }: { method?: 'GET' | 'POST' } = {},
): Promise<TData> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_API_URL ?? DEFAULT_ENDPOINT

  const response =
    method === 'GET'
      ? // No Content-Type header: that keeps it a CORS "simple request", so the
        // browser skips the OPTIONS preflight round trip a JSON POST needs.
        await fetch(getUrl(endpoint, query, variables))
      : await fetch(endpoint, {
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

// GraphQL-over-HTTP GET: the operation in `query`, variables as JSON. The
// whitespace collapse just shortens the URL; the query strings are constants,
// so every call still produces the same URL (= the same cache entry).
function getUrl(endpoint: string, query: string, variables?: Record<string, unknown>): string {
  const url = new URL(endpoint)
  url.searchParams.set('query', query.replace(/\s+/g, ' ').trim())
  if (variables) url.searchParams.set('variables', JSON.stringify(variables))
  return url.toString()
}
