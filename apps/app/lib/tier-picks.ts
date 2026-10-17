import { isSkillIdShape } from '@/lib/custom-skill'
import type { Stat } from '@/lib/graphql/queries'

/** Level-up choices stored beside the advancement purchases (see db/migrations/003). */
export interface TierPicks {
  /** Type abilities picked at tier 2+: tier -> ability ids. */
  type: Record<string, string[]>
  /** Focus choice picked at tier 2+: tier -> ability ids of the chosen option(s). */
  focus: Record<string, string[]>
  /**
   * Skills picked for skill-granting abilities gained at tier 2+, or owed since
   * before skill choices existed: `skillGrantKey(...)` -> skill ids. Left out
   * while empty, so rows stored before this field existed still compare equal
   * to the parsed value (setTierPicks matches on the stored JSON).
   */
  skills?: Record<string, string[]> | undefined
  /**
   * Abilities picked for choice abilities (Blessing of the Gods, Cantrips) taken
   * at tier 2+, or owed since before they were answered: `abilityChoiceKey(...)`
   * -> ability ids. Left out while empty, like `skills`.
   */
  options?: Record<string, string[]> | undefined
  /**
   * Edges picked for Improved Edge taken at tier 2+, or owed since before the
   * pick existed: `skillGrantKey(...)` -> stat. Left out while empty, like `skills`.
   */
  edges?: Record<string, Stat> | undefined
  /**
   * Options bought later for XP (Cantrips): choice ability id -> the options, in
   * the order bought, `learn.count` per purchase. Not tied to a tier, so it
   * survives a tier being undone. Left out while empty, like `skills`.
   */
  learned?: Record<string, string[]> | undefined
  /**
   * A flavor gained in play instead of at creation (then `choices.flavorId` is
   * null): the flavor, the exchanges of already-picked Type abilities for its
   * abilities, and the XP it cost (0 when a character arc granted it), kept so
   * undoing refunds exactly that. Left out while there is none.
   */
  flavorGain?: FlavorGainPick | undefined
}

export interface FlavorGainPick {
  flavorId: string
  swaps: Array<{ tier: number; replaces: string; with: string }>
  costXp: number
}

/** The flavor a character has: the one chosen at creation, or else the one gained in play. */
export const flavorIdInUse = (choices: { flavorId: string | null }, picks: TierPicks) =>
  choices.flavorId ?? picks.flavorGain?.flavorId ?? null

export const EMPTY_PICKS: TierPicks = { type: {}, focus: {} }

export const isEmptyPicks = (p: TierPicks) =>
  Object.keys(p.type).length === 0 &&
  Object.keys(p.focus).length === 0 &&
  Object.keys(p.skills ?? {}).length === 0 &&
  Object.keys(p.options ?? {}).length === 0 &&
  Object.keys(p.edges ?? {}).length === 0 &&
  Object.keys(p.learned ?? {}).length === 0 &&
  p.flavorGain === undefined

const ID = /^[a-z0-9][a-z0-9-]{0,99}$/
// `advancement` keys belong to an ability bought as an Other Option (tier = the purchase's).
const SKILL_KEY = /^(type|focus|advancement):[1-6]:[a-z0-9-]{1,100}$/
// Choice abilities are Type picks (a flavor's abilities are picked among them),
// or abilities bought as an Other Option.
const OPTION_KEY = /^(type|advancement):[1-6]:[a-z0-9-]{1,100}$/

function parseRecord(
  raw: unknown,
  keyOk: (key: string) => boolean,
  idOk: (id: unknown) => boolean = (id) => typeof id === 'string' && ID.test(id),
  maxIds = 10,
): Record<string, string[]> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const out: Record<string, string[]> = {}
  for (const [key, ids] of Object.entries(raw)) {
    if (!keyOk(key) || !Array.isArray(ids) || ids.length > maxIds) return null
    if (!ids.every(idOk)) return null
    out[key] = ids as string[]
  }
  return out
}

const STATS: readonly Stat[] = ['MIGHT', 'SPEED', 'INTELLECT']

function parseEdges(raw: unknown): Record<string, Stat> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const out: Record<string, Stat> = {}
  for (const [key, stat] of Object.entries(raw)) {
    if (!SKILL_KEY.test(key) || !STATS.includes(stat as Stat)) return null
    out[key] = stat as Stat
  }
  return out
}

function parseFlavorGain(raw: unknown): FlavorGainPick | undefined | null {
  if (raw === undefined) return undefined
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const isId = (v: unknown): v is string => typeof v === 'string' && ID.test(v)
  if (!isId(r.flavorId) || !Array.isArray(r.swaps) || r.swaps.length > 30) return null
  if (!Number.isInteger(r.costXp) || (r.costXp as number) < 0 || (r.costXp as number) > 1000) {
    return null
  }
  const swaps: FlavorGainPick['swaps'] = []
  for (const swap of r.swaps) {
    if (typeof swap !== 'object' || swap === null) return null
    const w = swap as Record<string, unknown>
    if (!Number.isInteger(w.tier) || (w.tier as number) < 1 || (w.tier as number) > 6) return null
    if (!isId(w.replaces) || !isId(w.with)) return null
    swaps.push({ tier: w.tier as number, replaces: w.replaces, with: w.with })
  }
  return { flavorId: r.flavorId, swaps, costXp: r.costXp as number }
}

/** Runtime check of a stored/received picks object. */
export function parsePicks(raw: unknown): TierPicks | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const isTier = (key: string) => /^[2-6]$/.test(key)
  const type = parseRecord(r.type ?? {}, isTier)
  const focus = parseRecord(r.focus ?? {}, isTier)
  // Skill picks may be typed by the player (`custom:<text>`), not just catalog ids.
  const skills = parseRecord(r.skills ?? {}, (key) => SKILL_KEY.test(key), isSkillIdShape)
  const options = parseRecord(r.options ?? {}, (key) => OPTION_KEY.test(key))
  const edges = parseEdges(r.edges ?? {})
  const learned = parseRecord(r.learned ?? {}, (key) => ID.test(key), undefined, 100)
  const flavorGain = parseFlavorGain(r.flavorGain)
  if (!type || !focus || !skills || !options || !edges || !learned || flavorGain === null) {
    return null
  }
  return {
    type,
    focus,
    ...(Object.keys(skills).length > 0 ? { skills } : {}),
    ...(Object.keys(options).length > 0 ? { options } : {}),
    ...(Object.keys(edges).length > 0 ? { edges } : {}),
    ...(Object.keys(learned).length > 0 ? { learned } : {}),
    ...(flavorGain ? { flavorGain } : {}),
  }
}

export function withFlavorGain(picks: TierPicks, flavorGain: FlavorGainPick): TierPicks {
  return { ...picks, flavorGain }
}

export function withoutFlavorGain(picks: TierPicks): TierPicks {
  const rest = { ...picks }
  delete rest.flavorGain
  return rest
}

export function withPick(
  picks: TierPicks,
  kind: 'type' | 'focus',
  tier: number,
  ids: string[],
): TierPicks {
  return { ...picks, [kind]: { ...picks[kind], [String(tier)]: ids } }
}

export function withOptionPick(picks: TierPicks, key: string, abilityIds: string[]): TierPicks {
  return { ...picks, options: { ...picks.options, [key]: abilityIds } }
}

export function withEdgePick(picks: TierPicks, key: string, stat: Stat): TierPicks {
  return { ...picks, edges: { ...picks.edges, [key]: stat } }
}

/** Adds one purchase's worth of learned options for a choice ability. */
export function withLearned(picks: TierPicks, abilityId: string, optionIds: string[]): TierPicks {
  return {
    ...picks,
    learned: {
      ...picks.learned,
      [abilityId]: [...(picks.learned?.[abilityId] ?? []), ...optionIds],
    },
  }
}

/** Removes the `count` options bought in the purchase at `purchase` (0 = first). */
export function withoutLearnedPurchase(
  picks: TierPicks,
  abilityId: string,
  purchase: number,
  count: number,
): TierPicks {
  const kept = (picks.learned?.[abilityId] ?? []).filter(
    (_, i) => Math.floor(i / count) !== purchase,
  )
  const learned = Object.fromEntries(
    Object.entries({ ...picks.learned, [abilityId]: kept }).filter(([, ids]) => ids.length > 0),
  )
  // Everything else (a flavor gained in play included) is kept as it was.
  const rest = { ...picks }
  delete rest.learned
  return Object.keys(learned).length > 0 ? { ...rest, learned } : rest
}

export function withSkillPick(picks: TierPicks, key: string, skillIds: string[]): TierPicks {
  return { ...picks, skills: { ...picks.skills, [key]: skillIds } }
}

/**
 * The tier a keyed pick's ability was gained at. An Other Option purchase
 * tagged N is bought at tier N−1, so its `advancement:N:<id>` picks are owed
 * from N−1 on, before the tier is complete.
 */
function gainedAt(key: string): number {
  const [kind, tier] = key.split(':')
  return kind === 'advancement' ? Number(tier) - 1 : Number(tier)
}

/**
 * Drops the skill/option/Edge picks of the abilities an Other Option purchase
 * gave (`advancement:<tier>:<id>`), for when that purchase is undone.
 */
export function withoutPurchasePicks(
  picks: TierPicks,
  tier: number,
  abilityIds: string[],
): TierPicks {
  const gone = new Set(abilityIds.map((id) => `advancement:${tier}:${id}`))
  const keep = <V>(record: Record<string, V> | undefined) =>
    Object.fromEntries(Object.entries(record ?? {}).filter(([key]) => !gone.has(key)))
  const rest = { ...picks }
  delete rest.skills
  delete rest.options
  delete rest.edges
  const skills = keep(picks.skills)
  const options = keep(picks.options)
  const edges = keep(picks.edges)
  return {
    ...rest,
    ...(Object.keys(skills).length > 0 ? { skills } : {}),
    ...(Object.keys(options).length > 0 ? { options } : {}),
    ...(Object.keys(edges).length > 0 ? { edges } : {}),
  }
}

/**
 * The picks that still apply at `tier`: Type/Focus picks and typed-skill picks
 * made for a higher tier are dropped (a lower tier has nothing to pick yet).
 */
export function picksUpToTier(picks: TierPicks, tier: number): TierPicks {
  const upTo = (record: Record<string, string[]>) =>
    Object.fromEntries(Object.entries(record).filter(([t]) => Number(t) <= tier))
  // Keyed `<kind>:<tier>:<ability>`.
  const upToKeyed = <V>(record: Record<string, V> | undefined): Record<string, V> =>
    Object.fromEntries(Object.entries(record ?? {}).filter(([key]) => gainedAt(key) <= tier))
  const skills = upToKeyed(picks.skills)
  const options = upToKeyed(picks.options)
  const edges = upToKeyed(picks.edges)
  return {
    type: upTo(picks.type),
    focus: upTo(picks.focus),
    ...(Object.keys(skills).length > 0 ? { skills } : {}),
    ...(Object.keys(options).length > 0 ? { options } : {}),
    ...(Object.keys(edges).length > 0 ? { edges } : {}),
    // Not tied to a tier: it stays whatever tier the character drops to.
    ...(picks.learned ? { learned: picks.learned } : {}),
    // The gain stays too; only exchanges of picks from tiers no longer reached go.
    ...(picks.flavorGain
      ? {
          flavorGain: {
            ...picks.flavorGain,
            swaps: picks.flavorGain.swaps.filter((swap) => swap.tier <= tier),
          },
        }
      : {}),
  }
}
