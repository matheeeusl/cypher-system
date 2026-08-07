import { z } from 'zod'

import { LocalizedString } from './shared.js'

// Same shape as Cypher's effect table — an internal reference table some
// artifacts roll on, e.g. a level-to-duration lookup or a d100 contents
// list. `range` is a plain string since it's sometimes a roll range
// ("1–3") and sometimes just a level number used as a lookup key ("1").
const ArtifactEffectTableSchema = z.object({
  label: LocalizedString,
  entries: z.array(
    z.object({
      range: z.string(),
      text: LocalizedString,
    }),
  ),
})

export const ArtifactSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  level: z.string(), // dice notation, e.g. "1d6 + 2" — same convention as Cypher.level_range
  form: LocalizedString, // physical description, e.g. "Handheld device with a plastic panel screen..."
  effect_text: LocalizedString,
  // Present on some Artifacts, absent on others — not every artifact rolls
  // on an internal sub-table.
  effect_table: ArtifactEffectTableSchema.nullable(),
  // In-character flavor text, distinct from mechanical effect_text — only
  // a handful of artifacts have one.
  flavor_quote: LocalizedString.nullable(),
  // printed as-is, e.g. "1 in 1d20" | "Automatic" | "—" — confirmed as
  // free text rather than a {die, threshold} shape: real data includes
  // threshold ranges ("1–2 in 1d6") and long parenthetical clarifications
  // ("check each time used to provide an asset...") that shape couldn't
  // represent.
  depletion_die: z.string(),
})

export type Artifact = z.infer<typeof ArtifactSchema>
