import type { Type } from '@cypher/content'

import type { AdvancementPurchase, Stat } from './types'

const STATS: Stat[] = ['might', 'speed', 'intellect']

const ERRORS = {
  ALLOCATION_NEGATIVE: 'pool_point_allocation values must be non-negative integers',
  ALLOCATION_SUM: (label: string, expected: number, actual: number) =>
    `${label} must sum to exactly ${expected} (got ${actual})`,
}

function sumStats(allocation: Record<Stat, number>): number {
  return STATS.reduce((total, stat) => total + allocation[stat], 0)
}

function validateAllocation(
  label: string,
  allocation: Record<Stat, number>,
  expectedSum: number,
): void {
  for (const stat of STATS) {
    if (!Number.isInteger(allocation[stat]) || allocation[stat] < 0) {
      throw new Error(ERRORS.ALLOCATION_NEGATIVE)
    }
  }
  const sum = sumStats(allocation)
  if (sum !== expectedSum) {
    throw new Error(ERRORS.ALLOCATION_SUM(label, expectedSum, sum))
  }
}

/**
 * Final Pool max per stat: Type base + the player's 6-point creation
 * allocation + an optional Descriptor Pool bonus + every
 * 'increasing-capabilities' advancement purchase's 4-point split.
 */
export function derivePoolMax(
  type: Pick<Type, 'starting_pools'>,
  allocation: Record<Stat, number>,
  descriptorBonus: { stat: Stat; amount: number } | undefined,
  purchases: AdvancementPurchase[],
): Record<Stat, { max: number }> {
  validateAllocation('pool_point_allocation', allocation, 6)

  const pools: Record<Stat, number> = {
    might: type.starting_pools.might,
    speed: type.starting_pools.speed,
    intellect: type.starting_pools.intellect,
  }

  for (const stat of STATS) {
    pools[stat] += allocation[stat]
  }

  if (descriptorBonus) {
    pools[descriptorBonus.stat] += descriptorBonus.amount
  }

  for (const purchase of purchases) {
    if (purchase.option === 'increasing-capabilities') {
      validateAllocation(
        `stat_pool_allocation (tier ${purchase.tier})`,
        purchase.stat_pool_allocation,
        4,
      )
      for (const stat of STATS) {
        pools[stat] += purchase.stat_pool_allocation[stat]
      }
    }
  }

  return {
    might: { max: pools.might },
    speed: { max: pools.speed },
    intellect: { max: pools.intellect },
  }
}
