import { z } from 'zod'

import { LocalizedString } from './shared.js'

// No category taxonomy: the rulebook is explicit that there's no definitive,
// categorized list of skills — just a flat, illustrative one. The single
// exception is `combat`, which exists only because some abilities say
// "choose any two noncombat skills" (see Ability.skill_grant). It marks the
// skills that are about fighting — defense tasks and initiative — and is
// left out (false) everywhere else; it isn't a general classification.
export const SkillSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  combat: z.boolean().optional(),
})

export type Skill = z.infer<typeof SkillSchema>
