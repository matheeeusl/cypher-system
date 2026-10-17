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
import { fetchAdvancementRules, fetchFlavors, type SkillLevel } from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import type { AdvancementKey } from '@/lib/i18n/play'
import { sheetCopy } from '@/lib/i18n/sheet'
import { terms } from '@/lib/i18n/terms'
import type { InventoryItem, PlayData, PoolKey, PoolPoints } from '@/lib/play'

export interface PendingChoice {
  kind: 'type' | 'focus' | 'skill' | 'option' | 'edge'
  tier: number
  /** Only for kind 'skill' | 'option' | 'edge': the choice key to answer under, and the ability it comes from. */
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

/** Options a character can buy for XP (Cantrips), and what it has bought so far. */
export interface LearnView {
  abilityId: string
  abilityName: string
  costXp: number
  /** How many options one purchase brings. */
  count: number
  /** What can still be bought: the ability's options minus those already known. */
  options: PendingChoice['options']
  /** One entry per purchase, in order; `index` is what to undo. */
  purchases: Array<{ index: number; names: string[] }>
}

/** Gaining a flavor in play: what is on offer, or what was gained. Null when the flavor came with creation. */
export interface FlavorGainView {
  /** XP the purchase costs (a GM may grant it for free instead). */
  costXp: number
  gained: {
    name: string
    /** XP that was paid, refunded on undo. */
    paidXp: number
    swaps: Array<{ tier: number; replaces: string; with: string }>
  } | null
  /** Present while the character has no flavor. */
  offer: {
    /** Type abilities that can be given up: picked, untrained, with no picks of their own. */
    picks: Array<{ tier: number; id: string; name: string }>
    flavors: Array<{
      id: string
      name: string
      description: string
      /** Flavor abilities the Type doesn't offer and the character doesn't have. */
      abilities: Array<{ id: string; name: string; description: string; tier: number }>
    }>
  } | null
}

/** The abilities an Other Option can take now (the purchase is bought at the current tier). */
export interface OtherOptionsView {
  /** Type (and flavor) abilities of the current tier or lower, not known yet (repeatable ones are). */
  typeAbilities: Array<{ id: string; name: string; tier: number; flavor: string | null }>
  /** Unchosen options of Focus choices already made, at the current tier or lower. */
  focusOptions: Array<{ ids: string[]; name: string; tier: number }>
}

/** Everything the play screen needs, already localized and JSON-serializable. */
export interface PlayView {
  characterId: string
  name: string
  headline: string
  tier: number
  effort: number
  /** 1d6 + this: the tier plus the Other Option bonus. */
  recoveryRollBonus: number
  armorSpeedCostReduction: number
  pools: Array<{ key: PoolKey; name: string; edge: number; max: number }>
  spent: PoolPoints
  skills: Array<{ name: string; level: string; description: string | null; custom: boolean }>
  abilities: Array<{
    name: string
    meta: string
    description: string
    trained: boolean
    /** One of the options of the learnable choice ability (a cantrip): listed under its own heading. */
    grouped: boolean
  }>
  skillOptions: Array<{ id: string; name: string; level: SkillLevel | null }>
  advancement: {
    costXp: number
    perTier: number
    tier: number
    bought: AdvancementKey[]
    /** Already at the highest tier: nothing left to buy. */
    nextIsBlocked: boolean
    /** What the Other Option row offers this tier. */
    other: OtherOptionsView
  }
  /** Purchases made so far, in order; `revertable` ones can be undone. */
  purchases: Array<{ index: number; tier: number; label: string; revertable: boolean }>
  /** Known attack abilities, for the "train an ability" advancement. */
  abilityOptions: Array<{ id: string; name: string; trained: boolean }>
  /** Null when the character's flavor offers nothing to learn. */
  learn: LearnView | null
  flavorGain: FlavorGainView | null
  /** Level-up choices still owed (new tier's Type abilities, a Focus choice). */
  pending: PendingChoice[]
  xp: Array<{ id: number; kind: 'gain' | 'spend'; amount: number; reason: string; locked: boolean }>
  inventory: InventoryItem[]
  cypherLimit: number
  notes: Array<{ id: number; body: string; createdAt: string }>
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
    recoveryRollBonus: derived.tier + derived.recoveryRollBonus,
    armorSpeedCostReduction: derived.armorSpeedCostReduction,
    pools: POOLS.map(({ key, stat }) => ({
      key,
      name: t.stats[stat],
      edge: derived.edge[key],
      max: derived.pools[key].max,
    })),
    spent: play.spent,
    skills: sheetSkills(bundle, locale),
    abilities: groupedAbilities(bundle, locale),
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
      other: otherOptionsView(bundle, locale),
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
    learn: learnView(bundle, character, locale),
    flavorGain: await flavorGainView(bundle, character, rules.flavorCostXp, locale),
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
    notes: play.notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    })),
  }
}

/**
 * Type abilities picked so far that can be exchanged for a flavor's: those the
 * Type itself offers (a flavor one can't be given up), that no Skills advancement
 * trained, and that carry no picks of their own (their answers would be left
 * with nothing to belong to).
 */
export function swappablePicks(bundle: DerivedBundle, character: SavedCharacter) {
  const offeredByType = new Set(bundle.type.tierAbilities.flatMap((group) => group.abilityIds))
  const trained = new Set(
    bundle.derived.knownAbilities.filter((k) => k.trained).map((k) => k.abilityId),
  )
  const picked = [
    ...character.choices.tier1TypeAbilityIds.map((id) => ({ tier: 1, id })),
    ...Object.entries(character.tierPicks.type)
      .filter(([tier]) => Number(tier) <= bundle.derived.tier)
      .flatMap(([tier, ids]) => ids.map((id) => ({ tier: Number(tier), id }))),
  ]
  return picked.filter(({ id }) => {
    const ability = bundle.abilities.find((a) => a.id === id)
    return (
      !!ability &&
      offeredByType.has(id) &&
      !trained.has(id) &&
      !ability.skillGrant &&
      !ability.choice
    )
  })
}

async function flavorGainView(
  bundle: DerivedBundle,
  character: SavedCharacter,
  costXp: number,
  locale: Locale,
): Promise<FlavorGainView | null> {
  const gain = character.tierPicks.flavorGain
  const abilityOf = (id: string) => bundle.abilities.find((a) => a.id === id)
  const nameOf = (id: string) => {
    const a = abilityOf(id)
    return a ? loc(a.name, locale) : id
  }
  if (gain) {
    return {
      costXp,
      gained: {
        name: bundle.flavor ? loc(bundle.flavor.name, locale) : gain.flavorId,
        paidXp: gain.costXp,
        swaps: gain.swaps.map((swap) => ({
          tier: swap.tier,
          replaces: nameOf(swap.replaces),
          with: nameOf(swap.with),
        })),
      },
      offer: null,
    }
  }
  // A flavor chosen at creation: nothing to gain.
  if (character.choices.flavorId !== null) return null

  const offeredByType = new Set(bundle.type.tierAbilities.flatMap((group) => group.abilityIds))
  const known = new Set(bundle.derived.knownAbilities.map((k) => k.abilityId))
  const flavors = await fetchFlavors()
  return {
    costXp,
    gained: null,
    offer: {
      picks: swappablePicks(bundle, character).map(({ tier, id }) => ({
        tier,
        id,
        name: nameOf(id),
      })),
      flavors: flavors.map((flavor) => ({
        id: flavor.id,
        name: loc(flavor.name, locale),
        description: loc(flavor.description, locale) || loc(flavor.description, 'en'),
        abilities: flavor.tierAbilities
          .flatMap((group) => group.abilityIds.map((id) => ({ id, tier: group.tier })))
          .filter(({ id }) => !offeredByType.has(id) && !known.has(id))
          .map(({ id, tier }) => ({
            id,
            tier,
            name: nameOf(id),
            description: loc(abilityOf(id)?.description ?? { en: '', ptBR: '' }, locale),
          })),
      })),
    },
  }
}

/**
 * The character's abilities for the Skills tab. The options of the learnable
 * choice ability (the cantrips of a Modern Magic character) are flagged so the
 * screen lists them under their own heading; nobody else has any.
 */
function groupedAbilities(bundle: DerivedBundle, locale: Locale): PlayView['abilities'] {
  const grouped = new Set(learnableAbility(bundle)?.choice?.options ?? [])
  return sheetAbilities(bundle, locale).map(({ id, ...ability }) => ({
    ...ability,
    grouped: grouped.has(id),
  }))
}

/**
 * The ability whose options the character may buy for XP: one with a `choice.learn`
 * that the character's flavor lists (Cantrips, for Modern Magic). Null otherwise.
 */
export function learnableAbility(bundle: DerivedBundle) {
  const offered = new Set((bundle.flavor?.tierAbilities ?? []).flatMap((g) => g.abilityIds))
  return bundle.abilities.find((a) => a.choice?.learn && offered.has(a.id)) ?? null
}

function learnView(
  bundle: DerivedBundle,
  character: SavedCharacter,
  locale: Locale,
): LearnView | null {
  const ability = learnableAbility(bundle)
  const choice = ability?.choice
  if (!ability || !choice?.learn) return null
  const { xpCost, count } = choice.learn
  const known = new Set(bundle.derived.knownAbilities.map((k) => k.abilityId))
  const abilityOf = (id: string) => bundle.abilities.find((a) => a.id === id)
  const nameOf = (id: string) => {
    const a = abilityOf(id)
    return a ? loc(a.name, locale) : id
  }
  const bought = character.tierPicks.learned?.[ability.id] ?? []
  return {
    abilityId: ability.id,
    abilityName: loc(ability.name, locale),
    costXp: xpCost,
    count,
    options: choice.options
      .filter((id) => !known.has(id))
      .map((id) => ({
        id,
        label: nameOf(id),
        description: loc(abilityOf(id)?.description ?? { en: '', ptBR: '' }, locale),
        meta: '',
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale)),
    purchases: Array.from({ length: Math.floor(bought.length / count) }, (_, index) => ({
      index,
      names: bought.slice(index * count, (index + 1) * count).map(nameOf),
    })),
  }
}

function otherOptionsView(bundle: DerivedBundle, locale: Locale): OtherOptionsView {
  const { derived, type, focus, flavor, abilities } = bundle
  const nameOf = (id: string) => {
    const a = abilities.find((x) => x.id === id)
    return a ? loc(a.name, locale) : id
  }
  const known = new Set(derived.knownAbilities.map((k) => k.abilityId))
  // Abilities that may be taken again ("select this ability multiple times").
  const repeatable = (id: string) => !!abilities.find((a) => a.id === id)?.skillGrant?.repeatable
  const flavorName = flavor ? loc(flavor.name, locale) : null

  const listed = new Set<string>()
  const typeAbilities = [
    ...type.tierAbilities.map((g) => ({ ...g, flavor: null })),
    ...(flavor?.tierAbilities ?? []).map((g) => ({ ...g, flavor: flavorName })),
  ]
    .filter((g) => g.tier <= derived.tier)
    .sort((a, b) => a.tier - b.tier)
    .flatMap((g) =>
      g.abilityIds
        .filter((id) => (!known.has(id) || repeatable(id)) && !listed.has(id) && !!listed.add(id))
        .map((id) => ({ id, name: nameOf(id), tier: g.tier, flavor: g.flavor })),
    )

  // A Focus choice counts as made once one of its options is known from the Focus.
  const fromFocus = new Set(
    derived.knownAbilities
      .filter((k) => k.source.__typename === 'FocusAbilitySource')
      .map((k) => k.abilityId),
  )
  const focusOptions = focus.tierAbilities
    .filter((g) => g.tier <= derived.tier)
    .flatMap((g) =>
      g.entries.flatMap((entry) => {
        if (entry.__typename !== 'ChoiceAbility') return []
        if (!entry.options.some((ids) => ids.some((id) => fromFocus.has(id)))) return []
        return entry.options
          .filter((ids) => ids.every((id) => !known.has(id)))
          .map((ids) => ({ ids, name: ids.map(nameOf).join(' + '), tier: g.tier }))
      }),
    )

  return { typeAbilities, focusOptions }
}

const EDGE_KEY = { MIGHT: 'might', SPEED: 'speed', INTELLECT: 'intellect' } as const

function pendingChoices(
  bundle: DerivedBundle,
  character: SavedCharacter,
  locale: Locale,
): PendingChoice[] {
  const { derived, type, focus, flavor, abilities } = bundle
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
      // The Type's abilities of this tier or lower, then the flavor's (one the
      // Type also offers is listed once, as the Type's).
      const flavorLabel = flavor ? `${terms[locale].flavor}: ${loc(flavor.name, locale)}` : ''
      const groups = [
        ...type.tierAbilities.map((g) => ({ tier: g.tier, ids: g.abilityIds, extra: '' })),
        ...(flavor?.tierAbilities ?? []).map((g) => ({
          tier: g.tier,
          ids: g.abilityIds,
          extra: flavorLabel,
        })),
      ].sort((x, y) => x.tier - y.tier)
      const listed = new Set<string>()
      const options = groups
        .filter((group) => group.tier <= pick.tier)
        .flatMap((group) =>
          group.ids
            .filter((id) => !known.has(id) && !listed.has(id) && !!listed.add(id))
            .map((id) => ({
              id,
              label: nameOf(id),
              description: loc(abilityOf(id)?.description ?? { en: '', ptBR: '' }, locale),
              meta: [`${copy.tier} ${group.tier}`, group.extra].filter(Boolean).join(' · '),
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
    if (pick.kind === 'option') {
      // The abilities a choice ability offers, minus those already known; all of
      // them are answered at once.
      const choice = abilityOf(pick.abilityId ?? '')?.choice
      if (!pick.key || !pick.abilityId || !choice) return []
      return [
        {
          kind: 'option' as const,
          tier: pick.tier,
          skillKey: pick.key,
          abilityName: nameOf(pick.abilityId),
          required: pick.required,
          options: choice.options
            .filter((id) => !known.has(id))
            .map((id) => ({
              id,
              label: nameOf(id),
              description: loc(abilityOf(id)?.description ?? { en: '', ptBR: '' }, locale),
              meta: '',
            }))
            .sort((a, b) => a.label.localeCompare(b.label, locale)),
          alternateRequired: null,
          allowCustom: false,
        },
      ]
    }
    if (pick.kind === 'edge') {
      // Improved Edge: one Edge that was 0 when the ability was gained. Edge only
      // goes up, so one at 0 now was 0 then; the engine checks the rest.
      if (!pick.key || !pick.abilityId) return []
      const stats = (['MIGHT', 'SPEED', 'INTELLECT'] as const).filter(
        (stat) => derived.edge[EDGE_KEY[stat]] === 0,
      )
      return [
        {
          kind: 'edge' as const,
          tier: pick.tier,
          skillKey: pick.key,
          abilityName: nameOf(pick.abilityId),
          required: 1,
          options: stats.map((stat) => ({
            id: stat,
            label: terms[locale].stats[stat],
            description: '',
            meta: '',
          })),
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
