import { z } from 'zod'

import { LocalizedString } from './shared.js'

// Some cyphers (e.g. Chemical Factory) have a nested d100 sub-table the
// player rolls on again after the main effect — not every cypher has one,
// hence nullable rather than a required empty array.
const CypherEffectTableSchema = z.object({
  label: LocalizedString,
  entries: z.array(
    z.object({
      range: z.string(),
      text: LocalizedString,
    }),
  ),
})

export const CypherSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  // "All cyphers in this section may be manifest cyphers. It is the GM's
  // discretion whether a particular cypher can be a subtle cypher..." —
  // fantastic is its own category, not resolvable to manifest/subtle
  // without a per-campaign GM call.
  category: z.enum(['manifest', 'fantastic', 'subtle', 'power_boost']),
  page_ref: z.string(), // e.g. "Cypher System Rulebook, page 385"
  level_range: z.string(), // dice notation, e.g. "1d6 + 2" — printed as-is in the rulebook
  effect_text: LocalizedString,
  effect_table: CypherEffectTableSchema.nullable(),
})

export type Cypher = z.infer<typeof CypherSchema>
