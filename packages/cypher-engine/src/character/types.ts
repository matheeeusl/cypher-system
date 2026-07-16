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
   * variant: tier (string key, matching Focus.tier_abilities) -> the chosen
   * ability_id. "granted" abilities need no entry here.
   */
  focus_choice_selections: Record<string, string>

  advancement_purchases: AdvancementPurchase[]
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

export interface DerivedCharacter {
  tier: number
  pools: Record<Stat, { max: number }>
  edge: Record<Stat, number>
  effort: number
  known_abilities: KnownAbility[]
  /** Only entries actually touched by some source — not every skill at a default "practiced" level. */
  skills: Record<string, { level: SkillLevel }>
}
