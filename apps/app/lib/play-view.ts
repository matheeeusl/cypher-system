import {
  atMaxTier,
  boughtAtTier,
  choiceOf,
  purchaseTier,
  revertableIndexes,
} from '@/lib/advancement'
import { advancementReason } from '@/lib/advancement-reason'
import { customSkillText, isCustomSkill } from '@/lib/custom-skill'
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

export interface PendingChoice {
  kind: 'type' | 'focus' | 'skill'
  tier: number
  /** Only for kind 'skill': the choice key to answer under, and the ability it comes from. */
  skillKey: string | null
  abilityName: string | null
  required: number
  /** `id` is one option: a single ability id, or a bundled pair joined by ",". */
  options: Array<{ id: string; label: string; description: string; meta: string }>
  /** Only for kind 'skill': another pick count the ability accepts ("or specialize in one"). */
  alternateRequired: number | null
  /** Only for kind 'skill': the player may also type their own skill. */
  allowCustom: boolean
}

/** Everything the play screen needs, already localized and JSON-serializable. */
export interface PlayView {
  characterId: string
  name: string
  headline: string
  tier: number
  effort: number
  pools: Array<{ key: PoolKey; name: string; edge: number; max: number }>
  spent: PoolPoints
  skills: Array<{ name: string; level: string; description: string | null; custom: boolean }>
  abilities: Array<{ name: string; meta: string; description: string; trained: boolean }>
  skillOptions: Array<{ id: string; name: string; level: SkillLevel | null }>
  advancement: {
    costXp: number
    perTier: number
    tier: number
    bought: AdvancementKey[]
    /** Already at the highest tier: nothing left to buy. */
    nextIsBlocked: boolean
  }
  /** Purchases made so far, in order; `revertable` ones can be undone. */
  purchases: Array<{ index: number; tier: number; label: string; revertable: boolean }>
  /** Known attack abilities, for the "train an ability" advancement. */
  abilityOptions: Array<{ id: string; name: string; trained: boolean }>
  /** Level-up choices still owed (new tier's Type abilities, a Focus choice). */
  pending: PendingChoice[]
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
  const revertable = new Set(revertableIndexes(character.advancement))
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
    // The catalog, plus the skills the player typed for this character.
    skillOptions: [
      ...bundle.skills.map((s) => ({
        id: s.id,
        name: loc(s.name, locale),
        level: levelBySkill.get(s.id) ?? null,
      })),
      ...derived.skills
        .filter((s) => isCustomSkill(s.skillId))
        .map((s) => ({ id: s.skillId, name: customSkillText(s.skillId), level: s.level })),
    ].sort((a, b) => a.name.localeCompare(b.name, locale)),
    advancement: {
      costXp: rules.costXp,
      perTier: rules.perTier,
      tier: derived.tier,
      bought: [...bought],
      nextIsBlocked: atMaxTier(derived.tier, rules.maxTier),
    },
    purchases: character.advancement.map((p, index) => ({
      index,
      tier: purchaseTier(p),
      label: advancementReason(locale, choiceOf(p), bundle),
      revertable: revertable.has(index),
    })),
    abilityOptions: derived.knownAbilities.flatMap((known) => {
      const ability = bundle.abilities.find((a) => a.id === known.abilityId)
      // Only an attack can be trained by the Skills advancement.
      return ability?.attack
        ? [{ id: ability.id, name: loc(ability.name, locale), trained: known.trained }]
        : []
    }),
    pending: pendingChoices(bundle, character, locale),
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

function pendingChoices(
  bundle: DerivedBundle,
  character: SavedCharacter,
  locale: Locale,
): PendingChoice[] {
  const { derived, type, focus, abilities } = bundle
  const copy = sheetCopy[locale]
  const abilityOf = (id: string) => abilities.find((a) => a.id === id)
  const nameOf = (id: string) => {
    const a = abilityOf(id)
    return a ? loc(a.name, locale) : id
  }
  const known = new Set(derived.knownAbilities.map((k) => k.abilityId))
  const levelOf = new Map(derived.skills.map((skill) => [skill.skillId, skill.level]))
  // Skills already picked for other instances of an ability: the text asks for
  // "a different one each time". Keys end in `:<abilityId>`.
  const chosenFor = (abilityId: string) =>
    new Set(
      [
        ...Object.entries(character.choices.abilitySkillChoices),
        ...Object.entries(character.tierPicks.skills ?? {}),
      ]
        .filter(([key]) => key.endsWith(`:${abilityId}`))
        .flatMap(([, skillIds]) => skillIds),
    )

  return derived.pendingPicks.flatMap((pick): PendingChoice[] => {
    if (pick.kind === 'type') {
      const options = type.tierAbilities
        .filter((group) => group.tier <= pick.tier)
        .flatMap((group) =>
          group.abilityIds
            .filter((id) => !known.has(id))
            .map((id) => ({
              id,
              label: nameOf(id),
              description: loc(abilityOf(id)?.description ?? { en: '', ptBR: '' }, locale),
              meta: `${copy.tier} ${group.tier}`,
            })),
        )
      return [
        {
          kind: 'type' as const,
          tier: pick.tier,
          skillKey: null,
          abilityName: null,
          required: pick.required - pick.chosen,
          options,
          alternateRequired: null,
          allowCustom: false,
        },
      ]
    }
    if (pick.kind === 'skill') {
      const grant = abilityOf(pick.abilityId ?? '')?.skillGrant
      if (!pick.key || !pick.abilityId || !grant) return []
      // What a pick may be applied to depends on the shape's mode.
      const optionsFor = (mode: 'train' | 'train_or_specialize' | 'specialize') =>
        bundle.skills
          .filter((skill) => (grant.noncombat ? !skill.combat : grant.options.includes(skill.id)))
          .filter((skill) => {
            const level = levelOf.get(skill.id)
            if (chosenFor(pick.abilityId!).has(skill.id)) return false
            if (mode === 'specialize') return level === 'TRAINED'
            if (mode === 'train_or_specialize') return level !== 'SPECIALIZED'
            return level !== 'TRAINED' && level !== 'SPECIALIZED'
          })
          .map((skill) => ({
            id: skill.id,
            label: loc(skill.name, locale),
            description: '',
            meta: '',
          }))
          .sort((a, b) => a.label.localeCompare(b.label, locale))
      // One list for both shapes: the alternate (specialize) lists the skills
      // already trained, the main one those that can still be trained.
      const seen = new Set<string>()
      const options = [
        ...optionsFor(grant.mode),
        ...(grant.alternate ? optionsFor(grant.alternate.mode) : []),
      ].filter((o) => !seen.has(o.id) && !!seen.add(o.id))
      return [
        {
          kind: 'skill' as const,
          tier: pick.tier,
          skillKey: pick.key,
          abilityName: nameOf(pick.abilityId),
          required: pick.required,
          options,
          alternateRequired: grant.alternate?.count ?? null,
          allowCustom: grant.allowCustom,
        },
      ]
    }
    const entry = focus.tierAbilities
      .find((group) => group.tier === pick.tier)
      ?.entries.find((e) => e.__typename === 'ChoiceAbility')
    if (!entry || entry.__typename !== 'ChoiceAbility') return []
    return [
      {
        kind: 'focus' as const,
        tier: pick.tier,
        skillKey: null,
        abilityName: null,
        alternateRequired: null,
        allowCustom: false,
        required: entry.count,
        options: entry.options.map((ids) => ({
          id: ids.join(','),
          label: ids.map(nameOf).join(' + '),
          description: ids
            .map((id) => loc(abilityOf(id)?.description ?? { en: '', ptBR: '' }, locale))
            .join(' '),
          meta: `${copy.tier} ${pick.tier}`,
        })),
      },
    ]
  })
}
