import { isSkillIdShape } from '@/lib/custom-skill'

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
}

export const EMPTY_PICKS: TierPicks = { type: {}, focus: {} }

export const isEmptyPicks = (p: TierPicks) =>
  Object.keys(p.type).length === 0 &&
  Object.keys(p.focus).length === 0 &&
  Object.keys(p.skills ?? {}).length === 0 &&
  Object.keys(p.options ?? {}).length === 0

const ID = /^[a-z0-9][a-z0-9-]{0,99}$/
const SKILL_KEY = /^(type|focus):[1-6]:[a-z0-9-]{1,100}$/
// Choice abilities are always Type picks (a flavor's abilities are picked among them).
const OPTION_KEY = /^type:[1-6]:[a-z0-9-]{1,100}$/

function parseRecord(
  raw: unknown,
  keyOk: (key: string) => boolean,
  idOk: (id: unknown) => boolean = (id) => typeof id === 'string' && ID.test(id),
): Record<string, string[]> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const out: Record<string, string[]> = {}
  for (const [key, ids] of Object.entries(raw)) {
    if (!keyOk(key) || !Array.isArray(ids) || ids.length > 10) return null
    if (!ids.every(idOk)) return null
    out[key] = ids as string[]
  }
  return out
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
  if (!type || !focus || !skills || !options) return null
  return {
    type,
    focus,
    ...(Object.keys(skills).length > 0 ? { skills } : {}),
    ...(Object.keys(options).length > 0 ? { options } : {}),
  }
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

export function withSkillPick(picks: TierPicks, key: string, skillIds: string[]): TierPicks {
  return { ...picks, skills: { ...picks.skills, [key]: skillIds } }
}

/**
 * The picks that still apply at `tier`: Type/Focus picks and typed-skill picks
 * made for a higher tier are dropped (a lower tier has nothing to pick yet).
 */
export function picksUpToTier(picks: TierPicks, tier: number): TierPicks {
  const upTo = (record: Record<string, string[]>) =>
    Object.fromEntries(Object.entries(record).filter(([t]) => Number(t) <= tier))
  // Keyed `<kind>:<tier>:<ability>`.
  const upToKeyed = (record: Record<string, string[]> | undefined) =>
    Object.fromEntries(
      Object.entries(record ?? {}).filter(([key]) => Number(key.split(':')[1]) <= tier),
    )
  const skills = upToKeyed(picks.skills)
  const options = upToKeyed(picks.options)
  return {
    type: upTo(picks.type),
    focus: upTo(picks.focus),
    ...(Object.keys(skills).length > 0 ? { skills } : {}),
    ...(Object.keys(options).length > 0 ? { options } : {}),
  }
}
