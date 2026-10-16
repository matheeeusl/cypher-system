import type { UrlLocale } from './locale'

// The pt-BR word for "flavor" is "Traço" (confirmed by Matheus, 2026-10-16).
// Every place that needs the term reads it from here — except astro.config.mjs's
// sidebar label, which can't import this file and carries a `FLAVOR_TERM`
// comment instead. `anchor` is the id of the "Flavor" heading in the
// character-creation chapter, which differs per locale because the slug is
// derived from the heading text.
export const FLAVOR_TERM: Record<UrlLocale, { singular: string; plural: string; anchor: string }> =
  {
    en: { singular: 'Flavor', plural: 'Flavors', anchor: 'flavor' },
    'pt-br': { singular: 'Traço', plural: 'Traços', anchor: 'traço' },
  }
