import { z } from 'zod'

export const LocalizedString = z.object({ en: z.string(), 'pt-BR': z.string() })

// content_version is computed by the loader from the parsed file contents —
// authors never write it, so it's attached after loading rather than being
// part of any authored schema.
export type WithVersion<T> = T & { content_version: string }
