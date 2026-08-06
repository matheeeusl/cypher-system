import { z } from 'zod'

import { LocalizedString, PriceTierId } from './shared.js'

// A single shared reference table, not an entity — see "Conventions" in
// this package's CLAUDE.md. Purely descriptive (no formula uses it), unlike
// weapon/armor category stats, which is why it needs localized text.
export const PriceTierTableSchema = z.array(
  z.object({
    id: PriceTierId,
    description: LocalizedString,
  }),
)

export type PriceTierTable = z.infer<typeof PriceTierTableSchema>
