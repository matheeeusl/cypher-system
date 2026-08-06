import { z } from 'zod'

import { LocalizedString } from './shared.js'

export const AbilitySchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  tier: z.number().int().min(1).max(6),
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
  sources: z
    .array(
      z.object({
        type: z.enum(['type', 'focus']),
        id: z.string(),
      }),
    )
    .min(1),
})

export type Ability = z.infer<typeof AbilitySchema>
