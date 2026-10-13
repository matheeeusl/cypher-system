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
}

export const EMPTY_PICKS: TierPicks = { type: {}, focus: {} }

export const isEmptyPicks = (p: TierPicks) =>
  Object.keys(p.type).length === 0 &&
  Object.keys(p.focus).length === 0 &&
  Object.keys(p.skills ?? {}).length === 0

const ID = /^[a-z0-9][a-z0-9-]{0,99}$/
const SKILL_KEY = /^(type|focus):[1-6]:[a-z0-9-]{1,100}$/

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
  if (!type || !focus || !skills) return null
  return Object.keys(skills).length > 0 ? { type, focus, skills } : { type, focus }
}

export function withPick(
  picks: TierPicks,
  kind: 'type' | 'focus',
  tier: number,
  ids: string[],
): TierPicks {
  return { ...picks, [kind]: { ...picks[kind], [String(tier)]: ids } }
}

export function withSkillPick(picks: TierPicks, key: string, skillIds: string[]): TierPicks {
  return { ...picks, skills: { ...picks.skills, [key]: skillIds } }
}
