import type { AdvancementPurchase } from './types'

/**
 * Every character starts with an Effort score of 1; each 'extra-effort'
 * advancement purchase adds 1.
 */
export function deriveEffort(purchases: AdvancementPurchase[]): number {
  return 1 + purchases.filter((purchase) => purchase.option === 'extra-effort').length
}
