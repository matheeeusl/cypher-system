// URL locale segments are lowercase ('en', 'pt-br') to match the site's
// locale-prefixed routing (astro.config.mjs); @cypher/content's
// LocalizedString fields are keyed by BCP-47 casing ('en', 'pt-BR'). This
// module bridges the two for every generated entity-reference page.
//
// Exported from its own module (rather than declared inline in a page's
// frontmatter) because Astro's getStaticPaths() runs in an isolated scope
// and can only see values reachable via `import` — sibling consts/functions
// declared elsewhere in the same frontmatter block are not visible to it.
export const LOCALE_TO_FIELD_KEY = { en: 'en', 'pt-br': 'pt-BR' } as const
export type UrlLocale = keyof typeof LOCALE_TO_FIELD_KEY
export const URL_LOCALES = Object.keys(LOCALE_TO_FIELD_KEY) as UrlLocale[]

export function pick(field: Record<'en' | 'pt-BR', string>, locale: UrlLocale): string {
  return field[LOCALE_TO_FIELD_KEY[locale]]
}
