import { z } from 'zod'

import { LocalizedString } from './shared.js'

export const FlavorSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  // The abilities a flavor offers at each tier, keyed by tier ('1'..'6') like
  // Type.tier_abilities. Unlike a Type there is no "choose N" count here: the
  // character still picks as many abilities per tier as their Type says
  // (Type.tier_choose_counts), and a flavor only widens the pool they pick
  // from — picking a flavor ability instead of a Type one is the book's
  // "permanently exchange" rule, and also its optional "flavors just add to
  // your choices" variant. Every id must resolve to an Ability whose `sources`
  // lists this flavor at that same tier (checked in loader.test.ts).
  tier_abilities: z.record(z.string(), z.array(z.string()).min(1)),
})

export type Flavor = z.infer<typeof FlavorSchema>
