import { z } from 'zod'

import { LocalizedString } from './shared.js'

// A single shared reference table, not an entity — see "Conventions" in
// this package's CLAUDE.md. Same shape as focus-connection-table.ts (one
// table, not per-entity), but keyed per-animal rather than per-focus.
// Referenced by Takes Animal Shape's Tier 1 "Animal Shape" ability, which
// grants two of these per transformation.
const OtherAbilityTag = z.enum([
  'aquatic',
  'armor',
  'constrict',
  'fast',
  'flying',
  'hands',
  'scent',
  'small',
  'venom',
])

export const AnimalFormMinorAbilitiesTableSchema = z.object({
  animals: z.array(
    z.object({
      id: z.string(),
      name: LocalizedString,
      // Prose, not an enum — several rows print an "or" choice (e.g. "Climbing
      // or stealth") rather than a single skill.
      skill_training: LocalizedString,
      other_ability: OtherAbilityTag,
    }),
  ),
  // The 9 "Other Abilities" tags used above, each defined once here rather
  // than repeated per animal row.
  ability_definitions: z.record(OtherAbilityTag, LocalizedString),
})

export type AnimalFormMinorAbilitiesTable = z.infer<typeof AnimalFormMinorAbilitiesTableSchema>
