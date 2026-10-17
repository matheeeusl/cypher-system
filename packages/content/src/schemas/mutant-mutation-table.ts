import { z } from 'zod'

import { LocalizedString } from './shared.js'

// The Mutant descriptor's five d100 tables (OG-CSPG pp. 82–89). A single
// shared reference table, not an entity — see "Conventions" in this
// package's CLAUDE.md. Every row is rolled, never chosen, so nothing links
// to a row by id.
export const MutantMutationTableSchema = z.array(
  z.object({
    id: z.enum(['beneficial', 'harmful', 'powerful', 'distinctive', 'cosmetic']),
    name: LocalizedString,
    intro: LocalizedString,
    page: z.number().int().positive(),
    rows: z
      .array(
        z.object({
          range: z.string(), // as printed, e.g. "01–05", "00" (= 100)
          name: LocalizedString,
          // What the mutation does; null for cosmetic mutations, which are
          // only a name.
          effect: LocalizedString.nullable(),
        }),
      )
      .min(1),
  }),
)

export type MutantMutationTable = z.infer<typeof MutantMutationTableSchema>
