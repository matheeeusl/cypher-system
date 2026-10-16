import type { Type } from '@cypher/content'

import type { FlavorContent } from './flavor.js'
import type { CharacterChoices } from './types.js'
import { CharacterRuleError } from '../errors.js'

type GainInput = Pick<
  CharacterChoices,
  | 'flavor_id'
  | 'flavor_gain'
  | 'tier_1_type_ability_ids'
  | 'type_ability_picks'
  | 'advancement_purchases'
>

const ERRORS = {
  CONFLICT: 'A character has one flavor: it was chosen at creation or gained in play, not both',
  REPLACES: (tier: number, id: string) =>
    `"${id}" is not an untrained Type ability picked at tier ${tier}, so it can't be exchanged`,
  WITH: (tier: number, id: string) =>
    `"${id}" is not a flavor ability of tier ${tier} or lower that the Type doesn't offer and the character doesn't have`,
  DUPLICATE: (id: string) => `"${id}" is exchanged more than once`,
  REPICKED: (id: string) => `"${id}" was given up for the flavor and can't be picked again`,
}

/**
 * Applies a flavor gained in play. A flavor from creation widens the pool the
 * Type picks come from; a flavor gained later does that for the picks still to
 * come *and* lets the player exchange picks already made ("if you gained your
 * flavor after reaching tier 2, the GM might allow a few additional
 * exchanges"). Rather than teach every later step about swaps, this rewrites
 * the choices: the gained flavor becomes `flavor_id`, and each exchange
 * replaces the given-up ability by the flavor one in the Type picks, so skill
 * grants, choice abilities and pending picks all behave as if it had been
 * picked there from the start. Without a gain the choices come back untouched.
 *
 * An exchange is valid when: the ability given up is a Type ability (not a
 * flavor one) picked at that tier and not trained by a Skills advancement;
 * the ability taken is one of the flavor's at that tier or lower, not one the
 * Type offers (that would be an ordinary pick) and not already the
 * character's; and no ability is exchanged twice. The ability given up can't be
 * picked later. Throws on a violation. The number of exchanges is not limited:
 * it is the GM's call.
 */
/** The choices without the `flavor_gain` key. */
export function withoutFlavorGain<C extends GainInput>(choices: C): C {
  const rest = { ...choices }
  delete rest.flavor_gain
  return rest
}

export function applyFlavorGain<C extends GainInput>(
  choices: C,
  content: {
    type: Pick<Type, 'id' | 'tier_abilities' | 'special_ability_id'>
    flavor?: FlavorContent | null | undefined
  },
): C {
  const gain = choices.flavor_gain
  if (!gain) return choices

  if (choices.flavor_id !== null && choices.flavor_id !== undefined) {
    throw new CharacterRuleError('FLAVOR_GAIN_CONFLICT', ERRORS.CONFLICT, {
      flavorId: choices.flavor_id,
    })
  }
  const flavor = content.flavor
  if (!flavor || flavor.id !== gain.flavor_id) {
    throw new CharacterRuleError('FLAVOR_UNKNOWN', `"${gain.flavor_id}" is not a known flavor`, {
      flavorId: gain.flavor_id,
    })
  }

  const { type } = content
  const offeredByType = new Set(Object.values(type.tier_abilities).flat())
  const trained = new Set(
    choices.advancement_purchases.flatMap((purchase) =>
      purchase.option === 'skills' && purchase.target.kind === 'ability'
        ? [purchase.target.ability_id]
        : [],
    ),
  )

  const picks: Record<string, string[]> = {
    '1': [...choices.tier_1_type_ability_ids],
    ...Object.fromEntries(
      Object.entries(choices.type_ability_picks ?? {}).map(([tier, ids]) => [tier, [...ids]]),
    ),
  }
  const owned = new Set([
    ...Object.values(picks).flat(),
    ...(type.special_ability_id ? [type.special_ability_id] : []),
  ])
  const givenUp = new Set<string>()
  const taken = new Set<string>()

  for (const swap of gain.swaps) {
    const list = picks[String(swap.tier)]
    const index = list?.indexOf(swap.replaces) ?? -1
    const params = { tier: swap.tier, replaces: swap.replaces, with: swap.with }

    if (givenUp.has(`${swap.tier}:${swap.replaces}`) || taken.has(swap.with)) {
      throw new CharacterRuleError(
        'FLAVOR_SWAP_DUPLICATE',
        ERRORS.DUPLICATE(taken.has(swap.with) ? swap.with : swap.replaces),
        params,
      )
    }
    if (!list || index < 0 || !offeredByType.has(swap.replaces) || trained.has(swap.replaces)) {
      throw new CharacterRuleError(
        'FLAVOR_SWAP_REPLACES_INVALID',
        ERRORS.REPLACES(swap.tier, swap.replaces),
        params,
      )
    }
    // Every flavor tier the ability is listed at counts: the lowest one decides.
    const lowest = Math.min(
      ...Object.entries(flavor.tier_abilities)
        .filter(([, ids]) => ids.includes(swap.with))
        .map(([tier]) => Number(tier)),
    )
    if (lowest > swap.tier || offeredByType.has(swap.with) || owned.has(swap.with)) {
      throw new CharacterRuleError(
        'FLAVOR_SWAP_WITH_INVALID',
        ERRORS.WITH(swap.tier, swap.with),
        params,
      )
    }

    list[index] = swap.with
    givenUp.add(`${swap.tier}:${swap.replaces}`)
    taken.add(swap.with)
    owned.add(swap.with)
  }

  // What was given up stays given up: no later pick may bring it back.
  const stillPicked = new Set(Object.values(picks).flat())
  for (const swap of gain.swaps) {
    if (stillPicked.has(swap.replaces)) {
      throw new CharacterRuleError('FLAVOR_SWAP_REPICKED', ERRORS.REPICKED(swap.replaces), {
        replaces: swap.replaces,
      })
    }
  }

  const { '1': tierOne = [], ...later } = picks
  return {
    ...withoutFlavorGain(choices),
    flavor_id: gain.flavor_id,
    tier_1_type_ability_ids: tierOne,
    ...(choices.type_ability_picks ? { type_ability_picks: later } : {}),
  }
}
