/**
 * The prefix every top bar starts with ("CYPHER://REFERENCE", "CYPHER://ACCOUNT"…).
 * Kept apart from the React components so non-React consumers (the Astro docs) can
 * import it through `@cypher/ui/brand` without pulling in the component barrel.
 */
export const BRAND_PREFIX = 'CYPHER://'
