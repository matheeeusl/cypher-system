import { gqlRequest } from '@/lib/graphql/client'

interface VersionRow {
  id: string
  contentVersion: string
}

export type ContentVersions = Map<string, string>

const VERSIONS_QUERY = `
  query ContentVersions {
    types { id contentVersion }
    descriptors { id contentVersion }
    foci { id contentVersion }
  }
`

/** contentVersion of every Type/Descriptor/Focus, keyed by entity id. */
export async function fetchContentVersions(): Promise<ContentVersions> {
  const data = await gqlRequest<{
    types: VersionRow[]
    descriptors: VersionRow[]
    foci: VersionRow[]
  }>(VERSIONS_QUERY)
  return new Map(
    [...data.types, ...data.descriptors, ...data.foci].map((r) => [r.id, r.contentVersion]),
  )
}
