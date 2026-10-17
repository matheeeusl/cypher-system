import type { Ability, Type } from '@cypher/content'

import type { SkillGrantInstance } from './ability-skill-grants.js'
import type { AdvancementPurchase, PendingPick, Stat } from './types.js'
import { CharacterRuleError } from '../errors.js'

export type EdgeGrant = NonNullable<Ability['edge_grant']>

/**
 * ability id -> its `edge_grant`, for just the abilities that have one. The
 * engine does no content I/O, so the caller builds this from the Ability
 * catalog (see `CharacterContent.edge_grants`).
 */
export type EdgeGrantsByAbility = Record<string, EdgeGrant>

/**
 * One time an Edge-granting ability was gained. Same collection and keys as
 * skill grants (`collectSkillGrantInstances`, `skillGrantKey`).
 */
export type EdgeGrantInstance = SkillGrantInstance<EdgeGrant>

const STATS: Stat[] = ['might', 'speed', 'intellect']

const ERRORS = {
  CHOICE_REQUIRED:
    'A starting_edge_choice is required: this Type offers more than one eligible stat',
  CHOICE_INVALID: "starting_edge_choice must be one of the Type's starting_edge.stat_choices",
  CHOICE_NOT_ALLOWED:
    'This Type has only one eligible starting_edge stat — no starting_edge_choice should be supplied',
  GRANT_UNKNOWN: (key: string) =>
    `ability_edge_choices has an entry "${key}" that matches no Edge choice the character has`,
  GRANT_NOT_ZERO: (abilityId: string, stat: Stat) =>
    `Ability "${abilityId}" can only raise an Edge that is 0, but ${stat} Edge is not`,
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
    if (choice === undefined)
      throw new CharacterRuleError('STARTING_EDGE_REQUIRED', ERRORS.CHOICE_REQUIRED)
    if (!stat_choices.includes(choice))
      throw new CharacterRuleError('STARTING_EDGE_INVALID', ERRORS.CHOICE_INVALID)
    return { stat: choice, amount }
  }

  if (choice !== undefined)
    throw new CharacterRuleError('STARTING_EDGE_NOT_ALLOWED', ERRORS.CHOICE_NOT_ALLOWED)
  // stat_choices is guaranteed non-empty by TypeSchema's .min(1).
  return { stat: stat_choices[0]!, amount }
}

/**
 * Edge per stat, applied in the order the character gained it: the resolved
 * starting Edge, then per tier the 'moving-toward-perfection' purchases
 * tagged that tier (a purchase tagged N leads *to* N), then the Edge-granting
 * abilities gained at that tier. The order matters for Improved Edge
 * (`choose_zero`): the picked stat must be 0 at the moment it is gained, and
 * becomes 1. A missing pick goes to `pending`, unless no Edge is 0 then —
 * there is nothing to choose. `grants` must be sorted by tier, as
 * `collectSkillGrantInstances` returns them.
 */
export function deriveEdge(
  resolvedStartingEdge: { stat: Stat; amount: number },
  purchases: AdvancementPurchase[],
  grants: EdgeGrantInstance[] = [],
  picks: Record<string, Stat> = {},
  pending: PendingPick[] = [],
): Record<Stat, number> {
  const chooseKeys = new Set(
    grants.filter((instance) => instance.grant.kind === 'choose_zero').map((i) => i.key),
  )
  for (const key of Object.keys(picks)) {
    if (!chooseKeys.has(key)) {
      throw new CharacterRuleError('EDGE_CHOICE_UNKNOWN', ERRORS.GRANT_UNKNOWN(key), { key })
    }
  }

  const edge: Record<Stat, number> = { might: 0, speed: 0, intellect: 0 }
  edge[resolvedStartingEdge.stat] = resolvedStartingEdge.amount

  const raises = purchases
    .filter((purchase) => purchase.option === 'moving-toward-perfection')
    .sort((a, b) => a.tier - b.tier)
  let next = 0
  const raiseThrough = (tier: number) => {
    for (; next < raises.length && raises[next]!.tier <= tier; next++) {
      edge[raises[next]!.edge_stat] += 1
    }
  }

  for (const { key, ability_id, tier, grant } of grants) {
    raiseThrough(tier)
    if (grant.kind === 'fixed') {
      edge[grant.stat] += grant.amount
      continue
    }
    const stat = picks[key]
    if (stat === undefined) {
      if (STATS.some((s) => edge[s] === 0)) pending.push({ kind: 'edge', tier, key, ability_id })
      continue
    }
    if (edge[stat] !== 0) {
      throw new CharacterRuleError(
        'EDGE_CHOICE_NOT_ZERO',
        ERRORS.GRANT_NOT_ZERO(ability_id, stat),
        {
          abilityId: ability_id,
          stat,
        },
      )
    }
    edge[stat] = 1
  }
  raiseThrough(Infinity)

  return edge
}
