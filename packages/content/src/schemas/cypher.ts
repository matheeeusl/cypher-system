import { z } from 'zod'

import { LocalizedString } from './shared.js'

export const CypherSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  level_range: z.string(), // dice notation, e.g. "1d6 + 2" — printed as-is in the rulebook
  category: z.enum(['manifest', 'subtle']), // a real rules distinction, not flavor text
  effect_text: LocalizedString,
})

export type Cypher = z.infer<typeof CypherSchema>
