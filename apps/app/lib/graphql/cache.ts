// In-memory cache for the rules catalogs (types, abilities…). Their content
// only changes when graphql-api is redeployed, so re-fetching them on every
// page view (326 KB for abilities alone) was pure latency. On the server one
// cached value is shared by every request this instance serves; in the
// browser (the wizard) it lasts for the tab.
//
// The TTL bounds how long an instance can keep serving catalogs from before
// an API deploy. Callers share the returned value, so never mutate it.

const CATALOG_TTL_MS = 10 * 60 * 1000

export function cachedCatalog<T>(load: () => Promise<T>): () => Promise<T> {
  let entry: { promise: Promise<T>; expiresAt: number } | null = null

  return () => {
    if (entry && entry.expiresAt > Date.now()) return entry.promise

    // The promise itself is cached (not the resolved value), so requests
    // arriving while the first fetch is still in flight wait on it instead
    // of starting their own.
    const promise = load()
    const current = { promise, expiresAt: Date.now() + CATALOG_TTL_MS }
    entry = current
    // A failed fetch must not stick for the whole TTL: drop it so the next
    // call retries (unless a newer fetch has already replaced it).
    promise.catch(() => {
      if (entry === current) entry = null
    })
    return promise
  }
}
