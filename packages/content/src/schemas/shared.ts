import { z } from 'zod'

export const LocalizedString = z.object({ en: z.string(), 'pt-BR': z.string() })

// The 6 abstract price tiers — shared by every reference table that prices
// something against them (weapon/armor categories, ammunition, price-tiers
// itself), rather than each repeating the same 6-value enum.
export const PriceTierId = z.enum([
  'inexpensive',
  'moderately_priced',
  'expensive',
  'very_expensive',
  'exorbitant',
  'priceless',
])

// content_version is computed by the loader from the parsed file contents —
// authors never write it, so it's attached after loading rather than being
// part of any authored schema.
export type WithVersion<T> = T & { content_version: string }
