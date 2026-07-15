
const ERRORS = {
    // A PC can apply at most 6 levels of Effort per action (base rules cap).
    INVALID_LEVELS: 'Effort levels must be between 0 and 6',
}

/**
 * Cost, in pool points, of applying Effort to a task.
 *
 * @param levels - number of Effort levels being applied (0-6). Each level
 *   of Effort steps the task's difficulty down by one.
 * @param edge - the character's Edge in the relevant stat. Edge reduces
 *   the pool cost of Effort point-for-point (it doesn't reduce difficulty).
 * @param hasWeakness - whether the character has a Weakness applying to
 *   this task, which raises its Effort cost.
 */
export function effortCost(levels: number, edge: number, hasWeakness = false): number {
  if (levels < 0 || levels > 6)
    throw new RangeError(ERRORS.INVALID_LEVELS)

  // The first level of Effort costs 3 points; every level after that
  // costs 2 more (so 0 levels = free, 1 = 3, 2 = 5, 3 = 7, ...).
  const base = levels === 0 ? 0 : 3 + 2 * (levels - 1)

  // A Weakness adds a flat +1 to the Effort cost for this task.
  const withWeakness = hasWeakness ? base + 1 : base

  // Edge pays for Effort point-for-point; cost can't drop below 0.
  return Math.max(0, withWeakness - edge)
}
