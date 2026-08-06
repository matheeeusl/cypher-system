import { z } from 'zod'

import { LocalizedString } from './shared.js'

// A single shared reference table, not an entity — see "Conventions" in
// this package's CLAUDE.md. No id/content_version: nothing snapshots
// against a reference table.
export const FocusConnectionTableSchema = z.array(
  z.object({
    range: z.string(), // e.g. "1–2", "19–20" — a printed range, not two ints
    text: LocalizedString,
  }),
)

export type FocusConnectionTable = z.infer<typeof FocusConnectionTableSchema>
