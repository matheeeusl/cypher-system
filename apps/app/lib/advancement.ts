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
  | { key: 'skills'; abilityId: string }

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
      return {
        skills: {
          tier,
          target:
            'skillId' in choice ? { skillId: choice.skillId } : { abilityId: choice.abilityId },
        },
      }
  }
}

/** True once the character is at the top tier and has nothing left to buy. */
export function atMaxTier(tier: number, maxTier: number): boolean {
  return tier >= maxTier
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
    case 'skills': {
      const valid = (v: unknown): v is string =>
        typeof v === 'string' && v.length > 0 && v.length < 100
      if (valid(r.skillId)) return { key: 'skills', skillId: r.skillId }
      if (valid(r.abilityId)) return { key: 'skills', abilityId: r.abilityId }
      return null
    }
    default:
      return null
  }
}

/** The one-click choice that produced a stored purchase (the inverse of `toPurchase`). */
export function choiceOf(p: AdvancementPurchaseInput): AdvancementChoice {
  if ('increasingCapabilities' in p) {
    return { key: 'pools', allocation: p.increasingCapabilities.statPoolAllocation }
  }
  if ('movingTowardPerfection' in p) {
    return { key: 'edge', stat: p.movingTowardPerfection.edgeStat }
  }
  if ('extraEffort' in p) return { key: 'effort' }
  const target = p.skills.target
  return 'skillId' in target
    ? { key: 'skills', skillId: target.skillId }
    : { key: 'skills', abilityId: target.abilityId }
}

/**
 * The tier a purchase list adds up to: tier N is reached once every tier
 * from 2 to N has `perTier` purchases tagged with it.
 */
export function tierOf(purchases: AdvancementPurchaseInput[], perTier: number): number {
  let tier = 1
  for (;;) {
    const bought = purchases.filter((p) => purchaseTier(p) === tier + 1).length
    if (bought < perTier) return tier
    tier += 1
  }
}

/**
 * Which purchases can be undone: those of the newest tier bought toward. An
 * older tier can't lose one while a later tier has some (the engine would
 * call it incomplete), so undoing goes newest tier first. Returns indexes.
 */
export function revertableIndexes(purchases: AdvancementPurchaseInput[]): number[] {
  if (purchases.length === 0) return []
  const newest = Math.max(...purchases.map(purchaseTier))
  return purchases.flatMap((p, i) => (purchaseTier(p) === newest ? [i] : []))
}
