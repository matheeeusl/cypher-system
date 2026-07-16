import { z } from 'zod'

import { LocalizedString } from './shared'

export const DescriptorSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  skill_bonuses: z.array(z.string()), // skill ids
  skill_inabilities: z.array(z.string()), // skill ids
  // Freeform text, not structured — player applies it manually, the app
  // does not auto-grant it.
  initial_bonus: LocalizedString,
  connection_text: LocalizedString,
})

export type Descriptor = z.infer<typeof DescriptorSchema>
