import type { Locale } from '@/lib/i18n/auth'

// The rules reference (apps/docs) is a separate site. NEXT_PUBLIC_ so client
// components can build links; baked in at build time, like the GraphQL URL.
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? 'https://csrd.app'

/** Entity categories that have a generated page in the docs (`/<locale>/<kind>/<id>/`). */
export type DocsEntityKind =
  'types' | 'descriptors' | 'foci' | 'flavors' | 'skills' | 'abilities' | 'cyphers' | 'artifacts'

export const docsLinks = {
  home: (locale: Locale) => `${DOCS_URL}/${locale}/`,
  entity: (locale: Locale, kind: DocsEntityKind, id: string) =>
    `${DOCS_URL}/${locale}/${kind}/${id}/`,
  /** A narrative chapter, e.g. `core-mechanics` → `/<locale>/rules/core-mechanics/`. */
  rules: (locale: Locale, slug: string) => `${DOCS_URL}/${locale}/rules/${slug}/`,
}
