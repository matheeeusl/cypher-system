import type { UrlLocale } from './locale'

// The pt-BR word for "flavor" is NOT decided yet (it has no confirmed Cypher
// translation; see packages/content/FLAVORS-PLAN.md, open question 2). Until
// it is, pt-BR pages show the English word. Every place that needs the term
// reads it from here — except astro.config.mjs's sidebar label, which can't
// import this file and carries a `FLAVOR_TERM` comment instead. When the
// term is confirmed, change it here, grep for FLAVOR_TERM, and fill the
// flavors' empty `description.pt-BR` in @cypher/content.
export const FLAVOR_TERM: Record<UrlLocale, { singular: string; plural: string }> = {
  en: { singular: 'Flavor', plural: 'Flavors' },
  'pt-br': { singular: 'Flavor', plural: 'Flavors' },
}
