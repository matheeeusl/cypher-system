import { z } from 'zod'

import { LocalizedString } from './shared.js'

// The book's descriptor groups (OG-CSPG p. 29): the 50 genre-agnostic
// ones, then one group per genre. Names and intros live in
// data/reference-tables/descriptor-categories.yaml.
export const DescriptorCategoryId = z.enum([
  'standard',
  'cyberpunk',
  'fairy-tale',
  'fantasy-species',
  'modern-magic',
  'post-apocalyptic',
  'science-fiction-species',
  'superhero',
  'weird-west',
])

const Stat = z.enum(['might', 'speed', 'intellect'])
const PoolBonusEntry = z.object({ stat: Stat, amount: z.number().int() })

// A Pool bonus the player decides, on top of the fixed `pool_bonus`:
// - divide: "N additional points to divide among <stats>" (Hideous: 4
//   among all three; Addicted: 2 between Might and Speed).
// - one-of: pick exactly one option, each a list of fixed bonuses (Sylph:
//   +2 Intellect or +2 Speed; Rusted: +2 Might, +2 Intellect, or +1 to all
//   three).
const PoolBonusChoice = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('divide'),
    points: z.number().int().positive(),
    stats: z
      .array(Stat)
      .min(1)
      .refine((stats) => new Set(stats).size === stats.length, {
        message: 'stats must not repeat',
      }),
  }),
  z.object({
    kind: z.literal('one-of'),
    options: z.array(z.array(PoolBonusEntry).min(1)).min(2),
  }),
])

// Real Descriptors (checked against all 50 core, genre-agnostic entries —
// Appealing through Weird, pages 30-54 of the source) mostly follow the
// same shape: an intro paragraph, then "You gain the following
// characteristics:" listing a pool bonus, skill training, occasional named
// traits/inability/equipment bonus, then "Initial Link to the Starting
// Adventure:" — 4 numbered options (genre ones may have none).
export const DescriptorSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  // Defaults to 'standard' so the 50 standard files don't need the key: the
  // loader hashes the raw YAML for content_version, and adding a key to
  // every file would mark every saved character as having stale rules.
  category: DescriptorCategoryId.default('standard'),
  // Fixed bonuses, all of them applied. Usually a single stat, but some
  // grant two (Tongue-Tied: +2 Might and +2 Speed) or a penalty (Clumsy:
  // +2 Might, −2 Speed). Can also be empty: 7 of the 50 core Descriptors
  // (e.g. Beneficent, Mysterious, Tough) grant no Pool bonus at all.
  // Lucky's separate Luck Pool isn't a stat Pool, so it stays in
  // `characteristics`.
  pool_bonus: z.array(PoolBonusEntry),
  // Points the player divides, or one option they pick (see
  // PoolBonusChoice). The book's sentence also stays in `characteristics`
  // when it is a named trait, so the docs keep the original text.
  pool_bonus_choice: PoolBonusChoice.nullable().default(null),
  // Named ability-like traits (Bold, Trivia, Contact, Helpful, etc.) —
  // distinct from pool bonus and skill training, which get their own
  // structured fields below rather than living in this catch-all.
  characteristics: z.array(
    z.object({
      name: LocalizedString,
      description: LocalizedString,
    }),
  ),
  skill_training: z.array(
    z.object({
      // Exactly one of skill_id/choice_count is set per entry: a specific
      // named skill, or "N skills of your choice."
      skill_id: z.string().nullable(),
      choice_count: z.number().int().nullable(),
      // Set only when a fixed skill starts above trained — the Elf's
      // perception is the one case in the book. Absent means trained, so
      // the other files don't gain a key (and keep their content_version).
      // A level that holds only somewhere (Elf: specialized in stealth in
      // natural woodland) stays trained here; the note carries the rest.
      level: z.literal('specialized').optional(),
      // The rest of the book's line when it adds a rule the id can't carry:
      // a condition (Bitter: "If a creature has wronged you, the tracking
      // task is eased"), a narrower choice (Uncanny: perception or stealth)
      // or a higher level in some cases (Elf: specialized in woodland).
      // Optional with no default, so files without it keep their
      // content_version.
      note: LocalizedString.optional(),
    }),
  ),
  // Prose, not skill ids — real inability text is often a whole task
  // category ("all physical attacks hindered"), not a single skill.
  inabilities: z.array(LocalizedString),
  // Present on some Descriptors, absent on others — genuinely optional,
  // not every Descriptor grants extra equipment.
  additional_equipment: LocalizedString.nullable(),
  // Replaces connection_text entirely — 4 numbered options in the source,
  // never freeform prose. Empty only where the book prints no "Initial
  // Link" section at all (Artificially Intelligent, Quintar).
  connection_options: z
    .array(LocalizedString)
    .refine((options) => options.length === 0 || options.length === 4, {
      message: 'connection_options must have exactly 4 entries, or none',
    }),
})

export type Descriptor = z.infer<typeof DescriptorSchema>
export type DescriptorCategoryId = z.infer<typeof DescriptorCategoryId>

// One row per category, in the book's order — see
// data/reference-tables/descriptor-categories.yaml.
export const DescriptorCategoryTableSchema = z.array(
  z.object({
    id: DescriptorCategoryId,
    name: LocalizedString,
    // The book's one-line introduction to the group; null for 'standard',
    // which has none.
    intro: LocalizedString.nullable(),
    // First page of the group in OG-CSPG.
    page: z.number().int().positive(),
  }),
)

export type DescriptorCategoryTable = z.infer<typeof DescriptorCategoryTableSchema>
