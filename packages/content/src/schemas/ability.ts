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
  action_type: z.enum(['action', 'enabler', 'passive']),
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
