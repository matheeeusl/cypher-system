import type { CharacterSheetData } from '@cypher/ui'

import { buildCharacterChoicesInput } from '@/components/wizard/derive'
import type { SavedCharacter } from '@/lib/characters'
import {
  fetchAbilities,
  fetchDescriptors,
  fetchFoci,
  fetchSkills,
  fetchTypes,
  validateCharacterChoices,
  type Stat,
} from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import { sheetCopy } from '@/lib/i18n/sheet'
import { terms } from '@/lib/i18n/terms'

const STAT_ORDER: Stat[] = ['MIGHT', 'SPEED', 'INTELLECT']

/**
 * Derives the printable sheet for a saved character by re-running its choices
 * through graphql-api. Returns null when those choices are no longer valid
 * under the current rules. Throws if the rules API is unreachable.
 */
export async function buildCharacterSheet(
  character: SavedCharacter,
  locale: Locale,
): Promise<CharacterSheetData | null> {
  const copy = sheetCopy[locale]
  const t = terms[locale]
  const [types, descriptors, foci, skills, abilities] = await Promise.all([
    fetchTypes(),
    fetchDescriptors(),
    fetchFoci(),
    fetchSkills(),
    fetchAbilities(),
  ])

  const { choices } = character
  const type = types.find((t) => t.id === choices.typeId)
  const descriptor = descriptors.find((d) => d.id === choices.descriptorId)
  const focus = foci.find((f) => f.id === choices.focusId)
  if (!type || !descriptor || !focus) return null

  const input = buildCharacterChoicesInput(choices, { type, descriptor, focus })
  if (!input) return null
  const result = await validateCharacterChoices(input)
  if (result.__typename !== 'ValidCharacterResult') return null
  const derived = result.character

  const poolKey = { MIGHT: 'might', SPEED: 'speed', INTELLECT: 'intellect' } as const
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
      // Experience isn't tracked yet, so every character starts at 0.
      { label: copy.xp, value: '0' },
    ],
    // Current = max: there is no in-play state (damage, spent points) yet.
    pools: STAT_ORDER.map((stat) => ({
      name: t.stats[stat],
      edge: derived.edge[poolKey[stat]],
      current: derived.pools[poolKey[stat]].max,
      max: derived.pools[poolKey[stat]].max,
    })),
    skills: derived.skills.map((s) => ({
      name: loc(
        skills.find((k) => k.id === s.skillId)?.name ?? { en: s.skillId, ptBR: s.skillId },
        locale,
      ),
      level: t.skillLevels[s.level],
    })),
    abilities: derived.knownAbilities.flatMap((known) => {
      const ability = abilities.find((a) => a.id === known.abilityId)
      if (!ability) return []
      const source =
        known.source.__typename === 'TypeAbilitySource' ? copy.fromType : copy.fromFocus
      return [
        {
          name: loc(ability.name, locale),
          meta: [ability.cost ? t.cost(ability.cost.amount, ability.cost.pool) : null, source]
            .filter(Boolean)
            .join(' · '),
          description: loc(ability.description, locale),
        },
      ]
    }),
    inventory: [
      ...(equipment.weapon ? [{ name: loc(equipment.weapon, locale), meta: t.weapon }] : []),
      ...(equipment.clothing ? [{ name: t.clothingItem, meta: t.clothing }] : []),
      ...equipment.items.map((item) => ({
        name: t.items(item.count, item.exact, item.priceTier),
        meta: t.gear,
      })),
    ],
    background: choices.background,
  }
}
