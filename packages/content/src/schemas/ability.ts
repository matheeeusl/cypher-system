import { z } from 'zod'

import { LocalizedString } from './shared.js'

export const AbilitySchema = z.object({
  id: z.string(),
  name: LocalizedString,
  description: LocalizedString,
  cost: z
    .object({
      pool: z.enum(['might', 'speed', 'intellect']),
      amount: z.number().int().min(0),
    })
    .nullable(),
  // "passive" is never actually printed in the rulebook — confirmed zero
  // occurrences. "action_to_initiate"/"action_to_initiate_or_reinitiate"
  // are real, distinct printed tags for abilities that must be started
  // (and possibly restarted) with an action, not stylistic variants of a
  // plain "action".
  //
  // The values below `action_to_initiate_or_reinitiate` were added to cover
  // non-standard tags found across the Chapter 5 Foci audit (see
  // SCHEMA-GAPS-TODO.md item 1) — each is a distinct verb/phrase the
  // rulebook prints that the original 4-value enum couldn't represent.
  // Duration/timing clauses printed alongside a tag (e.g. "ten minutes to
  // complete") are NOT modeled here — they're preserved in a comment or the
  // ability's description instead, so this enum stays about *what kind* of
  // action it is, not how long it takes.
  // `action_or_enabler` covers genuinely dual-mode tags (the book itself
  // offers both, e.g. "Action or enabler.", "Enabler for X; action for Y.")
  // — several different exact phrasings collapse into this one value.
  action_type: z.enum([
    'action',
    'enabler',
    'action_to_initiate',
    'action_to_initiate_or_reinitiate',
    'action_or_enabler',
    'action_to_establish',
    'action_to_establish_contact',
    'action_to_animate',
    'action_to_manifest',
    'action_to_teleport',
    'action_to_change_or_revert',
    'action_to_enter_or_exit',
    'action_to_split_or_recombine',
    'action_to_create',
    'action_to_create_and_check',
    'action_to_create_and_direct',
    'action_to_produce_and_consume',
    'action_to_initiate_and_complete',
    'action_to_initiate_and_animate',
    'action_to_initiate_and_concentrate',
    'action_to_initiate_and_direct_per_round',
    'action_to_enter_and_traverse',
    'action_to_initiate_and_call',
    'action_to_create_and_modify',
    'action_to_initiate_and_drain',
    'action_to_change',
    'action_to_change_back',
    'action_to_activate',
  ]),
  // tier lives per-source, not on the ability itself: the same named
  // ability is sometimes printed under more than one Type/Focus at
  // different tiers (confirmed — e.g. "Surprise Attack" is tier 3 under
  // two Foci and tier 4 under a third), so a single top-level tier can't
  // represent it.
  // `cyberware` marks that this specific source's printing carries the
  // book's "~" (cyberware-derived ability) marker. It lives per-source,
  // not on the Ability as a whole, because the book itself is
  // inconsistent: the same ability is printed with the marker under one
  // Focus but without it under another (confirmed on ~15 abilities,
  // e.g. `machine-enhancement` under Explores Cyberspace but not under
  // Fuses Mind and Machine). Omitted/false, not invented, when a
  // source's printing has no marker.
  sources: z
    .array(
      z.object({
        type: z.enum(['type', 'focus']),
        id: z.string(),
        tier: z.number().int().min(1).max(6),
        cyberware: z.boolean().optional(),
      }),
    )
    .min(1),
})

export type Ability = z.infer<typeof AbilitySchema>
