import { z } from 'zod'

import { LocalizedString } from './shared.js'

export const FocusSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  connection_text: LocalizedString,
  // Focus abilities are mostly automatic grants, not a "choose N from a
  // pool" like Type abilities. A tier occasionally offers a binary choice
  // between exactly two abilities instead (commonly tier 3 and 6, but not
  // always — some Foci put it elsewhere).
  tier_abilities: z.record(
    z.string(),
    z.array(
      z.union([
        z.object({ kind: z.literal('granted'), ability_id: z.string() }),
        z.object({ kind: z.literal('choice'), options: z.array(z.string()).length(2) }),
      ]),
    ),
  ),
})

export type Focus = z.infer<typeof FocusSchema>
