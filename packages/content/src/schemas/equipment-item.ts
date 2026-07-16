import { z } from 'zod'

import { LocalizedString } from './shared'

export const EquipmentItemSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  category: z.enum(['weapon', 'armor', 'gear']),
  // Uniform optional fields regardless of category, mirroring Ability.cost's
  // nullable-field precedent — the loader doesn't enforce which stats apply
  // to which category.
  stats: z
    .object({
      damage: z.number().int().min(0).optional(),
      armor_value: z.number().int().min(0).optional(),
      // The rulebook only ever prices things by category, never a currency
      // figure — matching that exactly rather than inventing numbers.
      cost: z
        .enum([
          'inexpensive',
          'moderately_priced',
          'expensive',
          'very_expensive',
          'exorbitant',
          'priceless',
        ])
        .optional(),
      weight: z.number().min(0).optional(),
    })
    .optional(),
})

export type EquipmentItem = z.infer<typeof EquipmentItemSchema>
