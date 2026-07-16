import { z } from 'zod'

import { LocalizedString } from './shared'

export const TypeSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  tagline: LocalizedString,
  description: LocalizedString,
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
  starting_equipment: z.array(z.string()),
  tier_abilities: z.record(z.string(), z.array(z.string())),
})

export type Type = z.infer<typeof TypeSchema>
