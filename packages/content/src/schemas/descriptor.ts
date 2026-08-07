import { z } from 'zod'

import { LocalizedString } from './shared.js'

// Real Descriptors (checked against all 50 core, genre-agnostic entries —
// Appealing through Weird, pages 30-54 of the source) mostly follow the
// same shape: an intro paragraph, then "You gain the following
// characteristics:" listing a pool bonus, skill training, occasional named
// traits/inability/equipment bonus, then "Initial Link to the Starting
// Adventure:" — always exactly 4 numbered options.
export const DescriptorSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  // Almost always a single stat, but Strong-Willed and Tongue-Tied grant
  // two at once ("Actions, Not Words: +2 to your Might Pool, and +2 to
  // your Speed Pool") — an array covers both without a separate
  // paired-bonus shape. Can also be empty: 7 of the 50 core Descriptors
  // (e.g. Beneficent, Mysterious, Tough) grant no Might/Speed/Intellect
  // Pool bonus at all in the source text. Two more (Hideous's "4 points
  // to divide among your stat Pools," Lucky's separate Luck Pool) don't
  // fit "fixed stat + fixed amount" either way, so those live in
  // `characteristics` instead rather than being forced in here.
  pool_bonus: z.array(
    z.object({
      stat: z.enum(['might', 'speed', 'intellect']),
      amount: z.number().int(),
    }),
  ),
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
    }),
  ),
  // Prose, not skill ids — real inability text is often a whole task
  // category ("all physical attacks hindered"), not a single skill.
  inabilities: z.array(LocalizedString),
  // Present on some Descriptors, absent on others — genuinely optional,
  // not every Descriptor grants extra equipment.
  additional_equipment: LocalizedString.nullable(),
  // Replaces connection_text entirely — always exactly 4 numbered options
  // in the source, never freeform prose.
  connection_options: z.array(LocalizedString).length(4),
})

export type Descriptor = z.infer<typeof DescriptorSchema>
