/**
 * The cost, in XP, of a single character advancement.
 */
export const ADVANCEMENT_COST_XP = 4

/**
 * The cost, in XP, of gaining a flavor in play (the book lists it as a
 * long-term benefit or character advancement). A flavor granted by a
 * character arc is free: the caller just doesn't charge.
 */
export const FLAVOR_GAIN_COST_XP = 4

/**
 * Advancements needed to reach the next tier (up to tier 6). Each of the
 * standard advancements below can only be purchased once per tier, so a
 * character advancing by standard means alone takes all four exactly once.
 */
export const ADVANCEMENTS_PER_TIER = 4

/** The highest tier a character can reach. */
export const MAX_TIER = 6

/**
 * The standard menu of character advancements. Purchasing one costs
 * ADVANCEMENT_COST_XP and can only be done once per tier per advancement;
 * which stat Pool (or Edge) the bonus applies to is the player's choice,
 * not fixed by the advancement itself.
 */
export const STANDARD_ADVANCEMENTS = [
  { id: 'increasing-capabilities', effect: { kind: 'stat_pool', amount: 4 } },
  { id: 'moving-toward-perfection', effect: { kind: 'edge', amount: 1 } },
  { id: 'extra-effort', effect: { kind: 'effort', amount: 1 } },
  { id: 'skills', effect: { kind: 'skill', amount: 1 } },
] as const

/**
 * The "Other Options": once each tier, one of these can be bought in place of
 * a standard advancement (same XP cost). The tier still takes
 * ADVANCEMENTS_PER_TIER purchases.
 */
export const OTHER_ADVANCEMENTS = [
  { id: 'reduce-armor-speed-cost' },
  { id: 'recovery-roll-bonus' },
  { id: 'type-ability' },
  { id: 'focus-ability' },
] as const

/** What each 'recovery-roll-bonus' purchase adds to recovery rolls. */
export const RECOVERY_ROLL_BONUS = 2

/** What each 'reduce-armor-speed-cost' purchase takes off the Speed Effort cost of armor. */
export const ARMOR_SPEED_COST_REDUCTION = 1
