import { boughtAtTier, wouldReachBlockedTier } from '@/lib/advancement'
import { sheetAbilities, sheetSkills } from '@/lib/character-sheet'
import type { DerivedBundle } from '@/lib/character-derived'
import type { SavedCharacter } from '@/lib/characters'
import { fetchAdvancementRules, type SkillLevel } from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import type { AdvancementKey } from '@/lib/i18n/play'
import { sheetCopy } from '@/lib/i18n/sheet'
import { terms } from '@/lib/i18n/terms'
import type { InventoryItem, PlayData, PoolKey, PoolPoints } from '@/lib/play'

/** Everything the play screen needs, already localized and JSON-serializable. */
export interface PlayView {
  characterId: string
  name: string
  headline: string
  tier: number
  effort: number
  pools: Array<{ key: PoolKey; name: string; edge: number; max: number }>
  spent: PoolPoints
  skills: Array<{ name: string; level: string }>
  abilities: Array<{ name: string; meta: string; description: string }>
  skillOptions: Array<{ id: string; name: string; level: SkillLevel | null }>
  advancement: {
    costXp: number
    perTier: number
    tier: number
    bought: AdvancementKey[]
    /** Buying one more would finish a tier we can't model yet (see lib/advancement.ts). */
    nextIsBlocked: boolean
  }
  xp: Array<{ id: number; kind: 'gain' | 'spend'; amount: number; reason: string; locked: boolean }>
  inventory: InventoryItem[]
  cypherLimit: number
  notes: string
}

const POOLS: Array<{ key: PoolKey; stat: 'MIGHT' | 'SPEED' | 'INTELLECT' }> = [
  { key: 'might', stat: 'MIGHT' },
  { key: 'speed', stat: 'SPEED' },
  { key: 'intellect', stat: 'INTELLECT' },
]

export async function buildPlayView(
  character: SavedCharacter,
  bundle: DerivedBundle,
  play: PlayData,
  locale: Locale,
): Promise<PlayView> {
  const rules = await fetchAdvancementRules()
  const t = terms[locale]
  const copy = sheetCopy[locale]
  const { derived, type, descriptor, focus } = bundle

  const bought = boughtAtTier(character.advancement, derived.tier + 1)
  const levelBySkill = new Map(derived.skills.map((s) => [s.skillId, s.level]))

  return {
    characterId: character.id,
    name: character.name,
    headline: [
      `${loc(descriptor.name, locale)} ${loc(type.name, locale)}`,
      loc(focus.name, locale),
      `${copy.tier} ${derived.tier}`,
    ].join(' · '),
    tier: derived.tier,
    effort: derived.effort,
    pools: POOLS.map(({ key, stat }) => ({
      key,
      name: t.stats[stat],
      edge: derived.edge[key],
      max: derived.pools[key].max,
    })),
    spent: play.spent,
    skills: sheetSkills(bundle, locale),
    abilities: sheetAbilities(bundle, locale),
    skillOptions: bundle.skills
      .map((s) => ({ id: s.id, name: loc(s.name, locale), level: levelBySkill.get(s.id) ?? null }))
      .sort((a, b) => a.name.localeCompare(b.name, locale)),
    advancement: {
      costXp: rules.costXp,
      perTier: rules.perTier,
      tier: derived.tier,
      bought: [...bought],
      nextIsBlocked: wouldReachBlockedTier(derived.tier, bought.size, rules.perTier),
    },
    xp: play.xp.map(({ id, kind, amount, reason, locked }) => ({
      id,
      kind,
      amount,
      reason,
      locked,
    })),
    inventory: play.inventory,
    cypherLimit: type.cypherLimit,
    notes: play.notes,
  }
}
