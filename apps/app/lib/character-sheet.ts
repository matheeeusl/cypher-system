import type { CharacterSheetData } from '@cypher/ui'

import { loadDerived, type DerivedBundle } from '@/lib/character-derived'
import type { SavedCharacter } from '@/lib/characters'
import type { Stat } from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import { sheetCopy } from '@/lib/i18n/sheet'
import { terms } from '@/lib/i18n/terms'
import { describeItem } from '@/lib/inventory-display'
import type { PlayData } from '@/lib/play'

const STAT_ORDER: Stat[] = ['MIGHT', 'SPEED', 'INTELLECT']

/** Trained skills with their level label, for the sheet and for play mode. */
export function sheetSkills(bundle: DerivedBundle, locale: Locale) {
  const t = terms[locale]
  return bundle.derived.skills.map((s) => ({
    name: loc(
      bundle.skills.find((k) => k.id === s.skillId)?.name ?? { en: s.skillId, ptBR: s.skillId },
      locale,
    ),
    level: t.skillLevels[s.level],
  }))
}

/** Known abilities with their cost/source line, for the sheet and for play mode. */
export function sheetAbilities(bundle: DerivedBundle, locale: Locale) {
  const copy = sheetCopy[locale]
  const t = terms[locale]
  return bundle.derived.knownAbilities.flatMap((known) => {
    const ability = bundle.abilities.find((a) => a.id === known.abilityId)
    if (!ability) return []
    const source = known.source.__typename === 'TypeAbilitySource' ? copy.fromType : copy.fromFocus
    return [
      {
        name: loc(ability.name, locale),
        meta: [ability.cost ? t.cost(ability.cost.amount, ability.cost.pool) : null, source]
          .filter(Boolean)
          .join(' · '),
        description: loc(ability.description, locale),
      },
    ]
  })
}

/**
 * Derives the printable sheet for a saved character by re-running its choices
 * (and advancement) through graphql-api. Returns null when those are no longer
 * valid under the current rules. Throws if the rules API is unreachable.
 * `play` supplies the live values (current pools, XP); without it the sheet
 * shows full pools and 0 XP.
 */
export async function buildCharacterSheet(
  character: SavedCharacter,
  locale: Locale,
  play?: PlayData | null,
): Promise<CharacterSheetData | null> {
  const copy = sheetCopy[locale]
  const t = terms[locale]
  const bundle = await loadDerived(character)
  if (!bundle) return null
  const { type, descriptor, focus, derived } = bundle

  const poolKey = { MIGHT: 'might', SPEED: 'speed', INTELLECT: 'intellect' } as const
  const xpTotal = (play?.xp ?? []).reduce(
    (sum, e) => sum + (e.kind === 'gain' ? e.amount : -e.amount),
    0,
  )
  const equipment = type.startingEquipment

  return {
    name: character.name,
    headline: [
      `${loc(descriptor.name, locale)} ${loc(type.name, locale)}`,
      loc(focus.name, locale),
      `${copy.tier} ${derived.tier}`,
    ].join(' · '),
    quickStats: [
      { label: copy.tier, value: String(derived.tier) },
      { label: copy.effort, value: String(derived.effort) },
      { label: copy.xp, value: String(xpTotal) },
    ],
    pools: STAT_ORDER.map((stat) => {
      const max = derived.pools[poolKey[stat]].max
      const spent = play?.spent[poolKey[stat]] ?? 0
      return {
        name: t.stats[stat],
        edge: derived.edge[poolKey[stat]],
        current: Math.max(0, max - spent),
        max,
      }
    }),
    skills: sheetSkills(bundle, locale),
    abilities: sheetAbilities(bundle, locale),
    inventory: [
      ...(equipment.weapon ? [{ name: loc(equipment.weapon, locale), meta: t.weapon }] : []),
      ...(equipment.clothing ? [{ name: t.clothingItem, meta: t.clothing }] : []),
      ...equipment.items.map((item) => ({
        name: t.items(item.count, item.exact, item.priceTier),
        meta: t.gear,
      })),
      // Carried cyphers and gear tracked in play mode.
      ...(play?.inventory ?? []).map((item) => {
        const { name, meta } = describeItem(item, locale)
        return { name, meta: `${meta} · ×${item.qty}` }
      }),
    ],
    background: character.choices.background,
  }
}
