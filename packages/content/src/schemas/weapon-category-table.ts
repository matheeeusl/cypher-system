import { z } from 'zod'

import { PriceTierId } from './shared.js'

// A single shared reference table, not an entity — see "Conventions" in
// this package's CLAUDE.md. The 3 weapon categories are fixed, universal
// facts (there is no per-item equipment catalog), not something to
// generate per-entity pages from.
export const WeaponCategoryTableSchema = z.array(
  z.object({
    id: z.enum(['light', 'medium', 'heavy']),
    damage: z.number().int().min(0),
    attack: z.enum(['eased', 'normal', 'two_handed']),
    // How this category is priced when buying one — see price-tiers.yaml
    // for what each tier means.
    price_tier: PriceTierId,
  }),
)

export type WeaponCategoryTable = z.infer<typeof WeaponCategoryTableSchema>
