import { z } from 'zod'

import { LocalizedString, PriceTierId } from './shared.js'

export const TypeSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  tagline: LocalizedString,
  // Three rulebook-defined lenses on what the Type means to play, not a
  // single flavor blurb — mirrors how the source text itself is structured.
  description: z.object({
    individual_role: LocalizedString,
    group_role: LocalizedString,
    societal_role: LocalizedString,
  }),
  player_intrusions: z.array(
    z.object({
      name: LocalizedString,
      description: LocalizedString,
    }),
  ),
  starting_pools: z.object({ might: z.number(), speed: z.number(), intellect: z.number() }),
  starting_edge: z.object({
    // Every Type has at least one eligible stat; some (like Warrior) offer a
    // real choice between two, with no book-given default to prefer.
    stat_choices: z.array(z.enum(['might', 'speed', 'intellect'])).min(1),
    amount: z.number().int().min(0),
  }),
  // Not every Type has a distinctly named, auto-granted special ability —
  // null where the source has nothing to point to, rather than inventing one.
  special_ability_id: z.string().nullable(),
  weapon_proficiency: z.object({
    practiced: z.array(z.enum(['light', 'medium', 'heavy'])),
    inability: z.array(z.enum(['light', 'medium', 'heavy'])),
  }),
  starting_skills: z.array(z.string()),
  // Real, per-Type differences — checked side by side across all 4 Types,
  // not a universal rule. "Appropriate clothing" is the one line that's
  // actually identical for every Type; weapon phrasing and the
  // expensive/moderately-priced/inexpensive item counts genuinely vary
  // (e.g. Warrior trades a second expensive item for a second weapon).
  starting_equipment: z.object({
    clothing: z.boolean(),
    // Free text, not structured — phrasing varies meaningfully between
    // Types ("one weapon of your choice" vs "one light weapon of your
    // choice" vs "two weapons of your choice"). Null for Adept, who gets
    // no starting weapon.
    weapon: LocalizedString.nullable(),
    items: z.array(
      z.object({
        price_tier: PriceTierId,
        count: z.number().int().min(0),
        // true when the rulebook states the count exactly ("four"), false
        // when it's a cap ("up to four").
        exact: z.boolean(),
      }),
    ),
  }),
  tier_abilities: z.record(z.string(), z.array(z.string())),
})

export type Type = z.infer<typeof TypeSchema>
