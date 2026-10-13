import type { AdvancementKey } from '@/lib/i18n/play'
import type { AdvancementPurchaseInput, Stat } from '@/lib/graphql/queries'

/** How the 4 points of Increasing Capabilities are split across the Pools. */
export interface PoolAllocation {
  might: number
  speed: number
  intellect: number
}

export const POOL_POINTS = 4

/** The one-click choice the player makes for an advancement. */
export type AdvancementChoice =
  | { key: 'pools'; allocation: PoolAllocation }
  | { key: 'edge'; stat: Stat }
  | { key: 'effort' }
  | { key: 'skills'; skillId: string }

export function advancementKeyOf(p: AdvancementPurchaseInput): AdvancementKey {
  if ('increasingCapabilities' in p) return 'pools'
  if ('movingTowardPerfection' in p) return 'edge'
  if ('extraEffort' in p) return 'effort'
  return 'skills'
}

export function purchaseTier(p: AdvancementPurchaseInput): number {
  if ('increasingCapabilities' in p) return p.increasingCapabilities.tier
  if ('movingTowardPerfection' in p) return p.movingTowardPerfection.tier
  if ('extraEffort' in p) return p.extraEffort.tier
  return p.skills.tier
}

/**
 * Which advancements were already bought toward `targetTier` (each can be
 * bought once per tier). A purchase's `tier` is the tier it leads to — the
 * engine's convention — so while at tier 1 the purchases being collected are
 * the ones tagged tier 2.
 */
export function boughtAtTier(
  purchases: AdvancementPurchaseInput[],
  tier: number,
): Set<AdvancementKey> {
  return new Set(purchases.filter((p) => purchaseTier(p) === tier).map(advancementKeyOf))
}

export function toPurchase(
  choice: AdvancementChoice,
  targetTier: number,
): AdvancementPurchaseInput {
  const tier = targetTier
  switch (choice.key) {
    case 'pools':
      return {
        increasingCapabilities: {
          tier,
          statPoolAllocation: choice.allocation,
        },
      }
    case 'edge':
      return { movingTowardPerfection: { tier, edgeStat: choice.stat } }
    case 'effort':
      return { extraEffort: { tier } }
    case 'skills':
      return { skills: { tier, target: { skillId: choice.skillId } } }
  }
}

/**
 * Highest tier a character can reach for now. Reaching tier 3 and above needs
 * new ability picks (a Focus choice at tier 3, Type abilities from tier 2) that
 * the engine and wizard don't model yet — see packages/cypher-engine/CLAUDE.md
 * "Known gaps". Until that lands, the purchase that would complete tier 2 is blocked.
 */
export const MAX_REACHABLE_TIER = 2

/** True when buying one more advancement while at `tier` (with `boughtCount` already bought toward the next) would finish the next tier. */
export function wouldReachBlockedTier(tier: number, boughtCount: number, perTier: number): boolean {
  return boughtCount + 1 >= perTier && tier + 1 > MAX_REACHABLE_TIER
}

const STATS: Stat[] = ['MIGHT', 'SPEED', 'INTELLECT']

/** Runtime check of an advancement choice arriving from the browser. */
export function parseChoice(raw: unknown): AdvancementChoice | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  switch (r.key) {
    case 'pools': {
      const a = r.allocation
      if (typeof a !== 'object' || a === null) return null
      const { might, speed, intellect } = a as Record<string, unknown>
      const parts = [might, speed, intellect]
      if (!parts.every((n) => Number.isInteger(n) && (n as number) >= 0)) return null
      if ((parts as number[]).reduce((x, y) => x + y, 0) !== POOL_POINTS) return null
      return {
        key: 'pools',
        allocation: {
          might: might as number,
          speed: speed as number,
          intellect: intellect as number,
        },
      }
    }
    case 'edge':
      return typeof r.stat === 'string' && STATS.includes(r.stat as Stat)
        ? { key: r.key, stat: r.stat as Stat }
        : null
    case 'effort':
      return { key: 'effort' }
    case 'skills':
      return typeof r.skillId === 'string' && r.skillId.length > 0 && r.skillId.length < 100
        ? { key: 'skills', skillId: r.skillId }
        : null
    default:
      return null
  }
}
