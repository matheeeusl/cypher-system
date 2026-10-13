/** Level-up choices stored beside the advancement purchases (see db/migrations/003). */
export interface TierPicks {
  /** Type abilities picked at tier 2+: tier -> ability ids. */
  type: Record<string, string[]>
  /** Focus choice picked at tier 2+: tier -> ability ids of the chosen option(s). */
  focus: Record<string, string[]>
}

export const EMPTY_PICKS: TierPicks = { type: {}, focus: {} }

export const isEmptyPicks = (p: TierPicks) =>
  Object.keys(p.type).length === 0 && Object.keys(p.focus).length === 0

const ID = /^[a-z0-9][a-z0-9-]{0,99}$/

function parseRecord(raw: unknown): Record<string, string[]> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const out: Record<string, string[]> = {}
  for (const [tier, ids] of Object.entries(raw)) {
    if (!/^[2-6]$/.test(tier) || !Array.isArray(ids) || ids.length > 10) return null
    if (!ids.every((id) => typeof id === 'string' && ID.test(id))) return null
    out[tier] = ids as string[]
  }
  return out
}

/** Runtime check of a stored/received picks object. */
export function parsePicks(raw: unknown): TierPicks | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const type = parseRecord(r.type ?? {})
  const focus = parseRecord(r.focus ?? {})
  return type && focus ? { type, focus } : null
}

export function withPick(
  picks: TierPicks,
  kind: 'type' | 'focus',
  tier: number,
  ids: string[],
): TierPicks {
  return { ...picks, [kind]: { ...picks[kind], [String(tier)]: ids } }
}
