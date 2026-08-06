import { z } from 'zod'

import { PriceTierId } from './shared.js'

// A single shared reference fact, not an entity — see "Conventions" in
// this package's CLAUDE.md. Ammunition is the one thing in the rulebook's
// equipment price summary that isn't a weapon/armor category (no
// damage/attack or armor/speed_cost of its own), so unlike those tables
// this is a single object, not an array — there's only one row.
export const AmmunitionSchema = z.object({
  price_tier: PriceTierId,
})

export type Ammunition = z.infer<typeof AmmunitionSchema>
