import { z } from 'zod'

import { LocalizedString } from './shared.js'

export const AbilitySchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  cost: z
    .object({
      pool: z.enum(['might', 'speed', 'intellect']),
      amount: z.number().int().min(0),
    })
    .nullable(),
  // "passive" is never actually printed in the rulebook — confirmed zero
  // occurrences. "action_to_initiate"/"action_to_initiate_or_reinitiate"
  // are real, distinct printed tags for abilities that must be started
  // (and possibly restarted) with an action, not stylistic variants of a
  // plain "action".
  action_type: z.enum([
    'action',
    'enabler',
    'action_to_initiate',
    'action_to_initiate_or_reinitiate',
  ]),
  // tier lives per-source, not on the ability itself: the same named
  // ability is sometimes printed under more than one Type/Focus at
  // different tiers (confirmed — e.g. "Surprise Attack" is tier 3 under
  // two Foci and tier 4 under a third), so a single top-level tier can't
  // represent it.
  sources: z
    .array(
      z.object({
        type: z.enum(['type', 'focus']),
        id: z.string(),
        tier: z.number().int().min(1).max(6),
      }),
    )
    .min(1),
})

export type Ability = z.infer<typeof AbilitySchema>
