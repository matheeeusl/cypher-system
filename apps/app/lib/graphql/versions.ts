import { cachedCatalog } from '@/lib/graphql/cache'
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
    flavors { id contentVersion }
  }
`

/** contentVersion of every Type/Descriptor/Focus/Flavor, keyed by entity id. */
export const fetchContentVersions = cachedCatalog(async (): Promise<ContentVersions> => {
  const data = await gqlRequest<{
    types: VersionRow[]
    descriptors: VersionRow[]
    foci: VersionRow[]
    flavors: VersionRow[]
  }>(VERSIONS_QUERY, undefined, { method: 'GET' })
  return new Map(
    [...data.types, ...data.descriptors, ...data.foci, ...data.flavors].map((r) => [
      r.id,
      r.contentVersion,
    ]),
  )
})

/** True when any entity the character was built from has changed since it was saved. */
export function isStale(saved: Record<string, string>, current: ContentVersions): boolean {
  return Object.entries(saved).some(
    ([id, version]) => current.has(id) && current.get(id) !== version,
  )
}
