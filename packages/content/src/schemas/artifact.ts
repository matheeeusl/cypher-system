import { z } from 'zod'

import { LocalizedString } from './shared'

export const ArtifactSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  level: z.string(), // dice notation, e.g. "1d6 + 2" — same convention as Cypher.level_range
  form: LocalizedString, // physical description, e.g. "Handheld device with a plastic panel screen..."
  depletion_die: z.string(), // printed as-is, e.g. "1 in 1d20" | "Automatic" | "—"
  effect_text: LocalizedString,
})

export type Artifact = z.infer<typeof ArtifactSchema>
