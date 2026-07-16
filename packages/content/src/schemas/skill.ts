import { z } from 'zod'

import { LocalizedString } from './shared'

// No category field: the rulebook is explicit that there's no definitive,
// categorized list of skills — just a flat, illustrative one.
export const SkillSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
})

export type Skill = z.infer<typeof SkillSchema>
