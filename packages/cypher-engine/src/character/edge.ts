import type { Type } from '@cypher/content'

import type { AdvancementPurchase, Stat } from './types.js'

const ERRORS = {
  CHOICE_REQUIRED:
    'A starting_edge_choice is required: this Type offers more than one eligible stat',
  CHOICE_INVALID: "starting_edge_choice must be one of the Type's starting_edge.stat_choices",
  CHOICE_NOT_ALLOWED:
    'This Type has only one eligible starting_edge stat — no starting_edge_choice should be supplied',
}

/**
 * Resolves which stat gets the Type's starting Edge. Some Types (e.g.
 * Warrior) let the player choose between two stats; most have exactly one.
 */
export function resolveStartingEdge(
  type: Pick<Type, 'starting_edge'>,
  choice?: Stat,
): { stat: Stat; amount: number } {
  const { stat_choices, amount } = type.starting_edge

  if (stat_choices.length > 1) {
    if (choice === undefined) throw new Error(ERRORS.CHOICE_REQUIRED)
    if (!stat_choices.includes(choice)) throw new Error(ERRORS.CHOICE_INVALID)
    return { stat: choice, amount }
  }

  if (choice !== undefined) throw new Error(ERRORS.CHOICE_NOT_ALLOWED)
  // stat_choices is guaranteed non-empty by TypeSchema's .min(1).
  return { stat: stat_choices[0]!, amount }
}

/**
 * Edge per stat: the resolved starting Edge, plus +1 per
 * 'moving-toward-perfection' advancement purchase on that stat.
 */
export function deriveEdge(
  resolvedStartingEdge: { stat: Stat; amount: number },
  purchases: AdvancementPurchase[],
): Record<Stat, number> {
  const edge: Record<Stat, number> = { might: 0, speed: 0, intellect: 0 }
  edge[resolvedStartingEdge.stat] = resolvedStartingEdge.amount

  for (const purchase of purchases) {
    if (purchase.option === 'moving-toward-perfection') {
      edge[purchase.edge_stat] += 1
    }
  }

  return edge
}
