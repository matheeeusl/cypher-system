export type Stat = 'might' | 'speed' | 'intellect'

export interface CharacterChoices {
  type_id: string
  descriptor_id: string
  focus_id: string

  /**
   * Required iff the Type's starting_edge.stat_choices has more than one
   * entry, and must be one of those entries. Supplying it when the Type has
   * only one eligible stat is also invalid — there's nothing to choose.
   */
  starting_edge_choice?: Stat

  /**
   * The Type's "6 additional points, divide however you wish" grant at
   * character creation. Must be non-negative integers summing to exactly 6.
   */
  pool_point_allocation: Record<Stat, number>

  /**
   * A Descriptor's freeform Pool bonus (e.g. Strong's "+4 to your Might
   * Pool"), entered by the player after reading Descriptor.initial_bonus
   * themselves — this is never parsed from that text. Optional since not
   * every Descriptor grants a Pool bonus.
   */
  descriptor_pool_bonus?: { stat: Stat; amount: number }

  /** Exactly the 4 ability ids chosen from the Type's tier_abilities["1"]. */
  tier_1_type_ability_ids: string[]

  /**
   * Only for Focus tiers whose tier_abilities entries include a `choice`
   * variant: tier (string key, matching Focus.tier_abilities) -> the ability
   * ids of the chosen option(s) — `count` options, a bundled pair counting as
   * one option but contributing both ids. "granted" abilities need no entry
   * here. A choice at tier 2+ may be left out for now (it becomes a pending
   * pick); tier 1 is the creation step and stays required.
   */
  focus_choice_selections: Record<string, string[]>

  /**
   * Skill ids chosen for the Descriptor's "N skills of your choice"
   * skill_training entries (the ones with choice_count set, as opposed to a
   * specific skill_id). Must total exactly the sum of every choice_count
   * across the Descriptor's skill_training array, with no duplicates.
   * Empty for a Descriptor with no choice entries (e.g. Strong, whose two
   * skill_training entries are both specific skill_ids).
   */
  descriptor_skill_choices: string[]

  advancement_purchases: AdvancementPurchase[]

  /**
   * Type abilities picked on reaching tier 2 and above: tier (string key) ->
   * ability ids. The pick count per tier is the Type's `tier_choose_counts`,
   * and each pick comes from that tier _or any lower one_. Picks not made yet
   * simply show up in `DerivedCharacter.pending_picks` — they are the player's
   * next to-do after a tier-up, not an error.
   */
  type_ability_picks?: Record<string, string[]>

  /**
   * Skills picked for abilities that carry a `skill_grant` ("trained in two
   * skills in which you are not already trained"). One entry per time the
   * ability was taken, keyed by `skillGrantKey(source kind, tier, ability id)`
   * — an ability that can be taken again at a later tier (Physical Skills)
   * gets a separate entry, and a separate set of skills, for each tier.
   * Missing picks, at any tier, are reported in `pending_picks` rather than
   * being an error.
   */
  ability_skill_choices?: Record<string, string[]>
}

export type AdvancementPurchase =
  | {
      tier: number
      option: 'increasing-capabilities'
      /** Must sum to 4. */
      stat_pool_allocation: Record<Stat, number>
    }
  | { tier: number; option: 'moving-toward-perfection'; edge_stat: Stat }
  | { tier: number; option: 'extra-effort' }
  | {
      tier: number
      option: 'skills'
      /**
       * The rulebook lets this advancement train either a skill or a
       * special ability the character already knows (including an
       * attack ability).
       */
      target: { kind: 'skill'; skill_id: string } | { kind: 'ability'; ability_id: string }
    }

// No 'advancement' source kind: the standard advancement menu can only
// train an ability the character already knows (see
// applyAbilityTrainingPurchase), never grant a new one. Only the
// out-of-scope "OTHER OPTIONS" substitution ("select another special
// ability from your type") could do that — add a source kind for it if/when
// substitutions get modeled, per "Known gaps" in this package's CLAUDE.md.
export type AbilitySource = { kind: 'type'; type_id: string } | { kind: 'focus'; focus_id: string }

export interface KnownAbility {
  ability_id: string
  source: AbilitySource
  /**
   * True if a 'skills' advancement purchase trained this ability (eases
   * tasks using it) — distinct from merely knowing the ability.
   */
  trained: boolean
}

export type SkillLevel = 'inability' | 'practiced' | 'trained' | 'specialized'

/** A level-up choice the character hasn't made yet. */
export type PendingPick =
  | { kind: 'type'; tier: number; required: number; chosen: number }
  | { kind: 'focus'; tier: number; required: number; chosen: number }
  /** Skills still to choose for a skill-granting ability gained at `tier`. */
  | {
      kind: 'skill'
      tier: number
      /** The `ability_skill_choices` key the picks belong under. */
      key: string
      ability_id: string
      required: number
      chosen: number
      /** Set when the ability can instead take this many picks (its `alternate` shape). */
      alternate_required?: number
    }

export interface DerivedCharacter {
  tier: number
  pools: Record<Stat, { max: number }>
  edge: Record<Stat, number>
  effort: number
  known_abilities: KnownAbility[]
  /** Only entries actually touched by some source — not every skill at a default "practiced" level. */
  skills: Record<string, { level: SkillLevel }>
  /** Type/Focus picks owed for tiers already reached (empty when nothing is outstanding). */
  pending_picks: PendingPick[]
}
