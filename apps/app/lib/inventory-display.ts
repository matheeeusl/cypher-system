import type { Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import { playCopy, type CypherCategoryKey } from '@/lib/i18n/play'
import type { InventoryItem } from '@/lib/play'

/** Name + detail line for a carried item, in the given language. */
export function describeItem(item: InventoryItem, locale: Locale): { name: string; meta: string } {
  if (item.kind === 'item') return { name: item.name, meta: item.meta }
  const copy = playCopy[locale].inventory
  const category = copy.categories[item.category as CypherCategoryKey] ?? item.category
  return { name: loc(item.name, locale), meta: copy.cypherMeta(category, item.level) }
}
