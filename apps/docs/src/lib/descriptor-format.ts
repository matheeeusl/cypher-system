import type { Descriptor, DescriptorCategoryId } from '@cypher/content'
import { getDescriptorCategoryTable } from '@cypher/content'
import { pick, type UrlLocale } from './locale'

// Display text for a Descriptor's Pool bonuses and its category, shared by
// the Descriptor index and the Descriptor page. Stat labels are UI chrome,
// not rulebook prose, so they live here rather than in @cypher/content.
const pt = (locale: UrlLocale) => locale === 'pt-br'

type Stat = 'might' | 'speed' | 'intellect'
type PoolBonus = Descriptor['pool_bonus'][number]

const STAT_LABELS: Record<Stat, [string, string]> = {
  might: ['Might', 'Força'],
  speed: ['Speed', 'Velocidade'],
  intellect: ['Intellect', 'Intelecto'],
}

export function statLabel(stat: Stat, locale: UrlLocale): string {
  const [en, ptBr] = STAT_LABELS[stat]
  return pt(locale) ? ptBr : en
}

// Signed amount: Clumsy's Speed bonus is −2, which a plain `+${amount}`
// would print as "+-2".
export function signedAmount(amount: number): string {
  return amount < 0 ? `−${-amount}` : `+${amount}`
}

// "+2 Speed", or "+1 Might, +1 Speed" for an option that grants two.
function bonusListText(bonuses: PoolBonus[], locale: UrlLocale): string {
  return bonuses
    .map((bonus) => `${signedAmount(bonus.amount)} ${statLabel(bonus.stat, locale)}`)
    .join(', ')
}

// The player's choice, in a few words: "2 points to divide" (and which
// stats, unless it's all three) or "+2 Intellect or +2 Speed".
export function poolChoiceText(
  choice: NonNullable<Descriptor['pool_bonus_choice']>,
  locale: UrlLocale,
): string {
  if (choice.kind === 'one-of') {
    return choice.options
      .map((option) => bonusListText(option, locale))
      .join(pt(locale) ? ' ou ' : ' or ')
  }
  const points = pt(locale)
    ? `${choice.points} ${choice.points === 1 ? 'ponto' : 'pontos'} para dividir`
    : `${choice.points} ${choice.points === 1 ? 'point' : 'points'} to divide`
  if (choice.stats.length === 3) return points
  const stats = choice.stats
    .map((stat) => statLabel(stat, locale))
    .join(pt(locale) ? ' e ' : ' and ')
  return pt(locale) ? `${points} entre ${stats}` : `${points} between ${stats}`
}

// One-line summary for the index list: fixed bonuses, then the choice.
export function poolSummary(descriptor: Descriptor, locale: UrlLocale): string {
  const parts = descriptor.pool_bonus.map(
    (bonus) => `${signedAmount(bonus.amount)} ${statLabel(bonus.stat, locale)}`,
  )
  if (descriptor.pool_bonus_choice) parts.push(poolChoiceText(descriptor.pool_bonus_choice, locale))
  return parts.join(' · ')
}

// The category table in the book's order (Standard first), with names and
// intros already picked for the locale.
export function descriptorCategories(locale: UrlLocale) {
  return getDescriptorCategoryTable().map((category) => ({
    id: category.id,
    name: pick(category.name, locale),
    intro: category.intro ? pick(category.intro, locale) : null,
  }))
}

export function categoryName(id: DescriptorCategoryId, locale: UrlLocale): string {
  const category = getDescriptorCategoryTable().find((entry) => entry.id === id)
  // The content loader test guarantees every enum value has a row.
  if (!category) throw new Error(`No descriptor category row for "${id}"`)
  return pick(category.name, locale)
}
