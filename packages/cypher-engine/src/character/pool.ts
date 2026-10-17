import type { Descriptor, Type } from '@cypher/content'

import type { AdvancementPurchase, DescriptorPoolChoice, Stat } from './types.js'
import { CharacterRuleError } from '../errors.js'

const STATS: Stat[] = ['might', 'speed', 'intellect']

const ERRORS = {
  ALLOCATION_NEGATIVE: 'pool_point_allocation values must be non-negative integers',
  ALLOCATION_SUM: (label: string, expected: number, actual: number) =>
    `${label} must sum to exactly ${expected} (got ${actual})`,
  CHOICE_REQUIRED: (kind: string) =>
    kind === 'divide'
      ? "descriptor_pool_choice must divide the Descriptor's Pool points (an allocation)"
      : "descriptor_pool_choice must pick one of the Descriptor's Pool options (an option_index)",
  CHOICE_UNEXPECTED: 'This Descriptor has no Pool choice; descriptor_pool_choice must be omitted',
  CHOICE_STAT: (stat: string) => `This Descriptor's Pool points can't go to ${stat}`,
  CHOICE_OPTION: (count: number) => `option_index must be between 0 and ${count - 1}`,
}

type DescriptorPools = Pick<Descriptor, 'pool_bonus' | 'pool_bonus_choice'>

/**
 * The extra Pool points the player's answer to the Descriptor's
 * `pool_bonus_choice` gives, per stat (all zero when there is no choice).
 * Throws when the answer is missing, of the wrong kind, or doesn't fit the
 * choice.
 */
export function resolveDescriptorPoolChoice(
  descriptor: DescriptorPools,
  choice: DescriptorPoolChoice | undefined,
): Record<Stat, number> {
  const extra: Record<Stat, number> = { might: 0, speed: 0, intellect: 0 }
  const offered = descriptor.pool_bonus_choice

  if (!offered) {
    if (choice) {
      throw new CharacterRuleError('DESCRIPTOR_POOL_CHOICE_UNEXPECTED', ERRORS.CHOICE_UNEXPECTED)
    }
    return extra
  }

  if (offered.kind === 'divide') {
    if (!choice || !('allocation' in choice)) {
      throw new CharacterRuleError(
        'DESCRIPTOR_POOL_CHOICE_REQUIRED',
        ERRORS.CHOICE_REQUIRED('divide'),
        { kind: 'divide' },
      )
    }
    for (const stat of STATS) {
      const points = choice.allocation[stat]
      if (!Number.isInteger(points) || points < 0) {
        throw new CharacterRuleError('POOL_ALLOCATION_NEGATIVE', ERRORS.ALLOCATION_NEGATIVE)
      }
      if (points > 0 && !offered.stats.includes(stat)) {
        throw new CharacterRuleError('DESCRIPTOR_POOL_CHOICE_STAT', ERRORS.CHOICE_STAT(stat), {
          stat,
        })
      }
      extra[stat] = points
    }
    const sum = sumStats(extra)
    if (sum !== offered.points) {
      throw new CharacterRuleError(
        'DESCRIPTOR_POOL_CHOICE_SUM',
        ERRORS.ALLOCATION_SUM('descriptor_pool_choice', offered.points, sum),
        { expected: offered.points, actual: sum },
      )
    }
    return extra
  }

  if (!choice || !('option_index' in choice)) {
    throw new CharacterRuleError(
      'DESCRIPTOR_POOL_CHOICE_REQUIRED',
      ERRORS.CHOICE_REQUIRED('one-of'),
      { kind: 'one-of' },
    )
  }
  const option = offered.options[choice.option_index]
  if (!Number.isInteger(choice.option_index) || !option) {
    throw new CharacterRuleError(
      'DESCRIPTOR_POOL_CHOICE_OPTION',
      ERRORS.CHOICE_OPTION(offered.options.length),
      { count: offered.options.length },
    )
  }
  for (const bonus of option) {
    extra[bonus.stat] += bonus.amount
  }
  return extra
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
      throw new CharacterRuleError('POOL_ALLOCATION_NEGATIVE', ERRORS.ALLOCATION_NEGATIVE)
    }
  }
  const sum = sumStats(allocation)
  if (sum !== expectedSum) {
    throw new CharacterRuleError(
      'POOL_ALLOCATION_SUM',
      ERRORS.ALLOCATION_SUM(label, expectedSum, sum),
      { label, expected: expectedSum, actual: sum },
    )
  }
}

/**
 * Final Pool max per stat: Type base + the player's 6-point creation
 * allocation + every fixed Descriptor Pool bonus + the player's answer to
 * the Descriptor's Pool choice + every 'increasing-capabilities'
 * advancement purchase's 4-point split.
 *
 * The fixed Descriptor bonus is read from content, never from the
 * player's choices: a Descriptor can grant several (Tongue-Tied: +2 Might
 * and +2 Speed) or a penalty (Clumsy: −2 Speed), and all of them apply.
 */
export function derivePoolMax(
  type: Pick<Type, 'starting_pools'>,
  allocation: Record<Stat, number>,
  descriptor: DescriptorPools,
  descriptorChoice: DescriptorPoolChoice | undefined,
  purchases: AdvancementPurchase[],
): Record<Stat, { max: number }> {
  validateAllocation('pool_point_allocation', allocation, 6)
  const chosen = resolveDescriptorPoolChoice(descriptor, descriptorChoice)

  const pools: Record<Stat, number> = {
    might: type.starting_pools.might,
    speed: type.starting_pools.speed,
    intellect: type.starting_pools.intellect,
  }

  for (const stat of STATS) {
    pools[stat] += allocation[stat] + chosen[stat]
  }

  for (const bonus of descriptor.pool_bonus) {
    pools[bonus.stat] += bonus.amount
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
