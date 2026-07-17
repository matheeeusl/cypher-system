import { z } from 'zod'

import { LocalizedString } from './shared.js'

export const OdditySchema = z.object({
  id: z.string(),
  description: LocalizedString,
})

export type Oddity = z.infer<typeof OdditySchema>
