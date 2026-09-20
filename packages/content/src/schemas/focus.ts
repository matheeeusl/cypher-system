import { z } from 'zod'

import { LocalizedString } from './shared.js'

export const FocusSchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  // Focus abilities are mostly automatic grants, not a "choose N from a
  // pool" like Type abilities. A tier occasionally offers a choice among
  // a pool of options instead (commonly tier 3 and 6, but not always —
  // some Foci put it elsewhere) — usually pick-1-of-2, but confirmed at
  // least one real pick-2-of-11 (Channels Divine Blessings, Tier 1), so
  // `count` isn't fixed at 1.
  // An option is usually a single ability_id, but the book sometimes
  // phrases a tier as "choose either X, or both Y and Z" (Transmits
  // Energy Tier 6, Turns Decay to Growth Tier 3) — a bundled pair
  // granted together as a single pick. A nested array represents that:
  // `count` still means "how many entries of `options` to pick," one
  // entry just happens to grant more than one ability.
  tier_abilities: z.record(
    z.string(),
    z.array(
      z.union([
        z.object({ kind: z.literal('granted'), ability_id: z.string() }),
        z.object({
          kind: z.literal('choice'),
          options: z.array(z.union([z.string(), z.array(z.string()).min(2)])).min(2),
          count: z.number().int().min(1),
        }),
      ]),
    ),
  ),
  // A few Foci let a player learn this specific Focus-granted ability
  // instead of a Type ability. Most Foci don't have one — null, not
  // invented, when the rulebook doesn't call one out. Almost always a
  // single ability, but Spits Fire and Lead (pág. 351) prints two
  // (Cogent Shot and Reload) under one "TYPE SWAP OPTION" heading,
  // both granted together — hence an array rather than a single id.
  type_swap_option: z.object({ ability_ids: z.array(z.string()).min(1) }).nullable(),
  // Present on some Foci, absent on others — same shape as Descriptor's
  // additional_equipment, genuinely optional here too (confirmed on only
  // 3 of 24 populated Foci so far: Blazes Paths, Codes Magic Apps,
  // Collects Bounties).
  additional_equipment: LocalizedString.nullable(),
  // Unlike Descriptor's connection_options (always exactly 4, present on
  // every Descriptor), this is nullable: most Foci rely on the shared
  // d100 Focus Connections table (data/reference-tables/) instead of
  // printing their own. Confirmed present on 4 of 24 populated Foci so
  // far: Blazes Paths, Codes Magic Apps, Collects Bounties, Is a Walking
  // Tank.
  connection_options: z.array(LocalizedString).length(4).nullable(),
  minor_effect_suggestion: LocalizedString.nullable(),
  major_effect_suggestion: LocalizedString.nullable(),
})

export type Focus = z.infer<typeof FocusSchema>
