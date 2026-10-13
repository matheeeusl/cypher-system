import type { PoolClient } from 'pg'

import { pool } from '@/lib/db'
import type { AdvancementPurchaseInput, LocalizedString } from '@/lib/graphql/queries'

// Authorization lives here (no RLS), same as lib/characters.ts: every function
// takes the session user's id and scopes by it. Never pass an id from the client.

export const POOL_KEYS = ['might', 'speed', 'intellect'] as const
export type PoolKey = (typeof POOL_KEYS)[number]
export type PoolPoints = Record<PoolKey, number>

export type InventoryItem =
  | { id: string; kind: 'item'; name: string; meta: string; qty: number }
  | {
      id: string
      kind: 'cypher'
      cypherId: string
      name: LocalizedString
      category: string
      level: string
      qty: number
    }

export interface XpEntry {
  id: number
  kind: 'gain' | 'spend'
  amount: number
  reason: string
  locked: boolean
  createdAt: Date
}

export interface PlayData {
  spent: PoolPoints
  notes: string
  inventory: InventoryItem[]
  xp: XpEntry[]
}

// Caps keep a single account from storing unbounded rows/JSON.
export const LIMITS = {
  xpEntries: 500,
  xpAmount: 1000,
  reason: 200,
  items: 200,
  itemName: 80,
  itemMeta: 80,
  itemQty: 999,
  notes: 20000,
} as const

const NO_SPENT: PoolPoints = { might: 0, speed: 0, intellect: 0 }

interface XpRow {
  id: string
  kind: 'gain' | 'spend'
  amount: number
  reason: string
  locked: boolean
  created_at: Date
}

const toXp = (r: XpRow): XpEntry => ({
  id: Number(r.id),
  kind: r.kind,
  amount: r.amount,
  reason: r.reason,
  locked: r.locked,
  createdAt: r.created_at,
})

/** Runs `fn` in a transaction, rolling back if it throws. */
async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }
}

/** True when the character exists and belongs to the user. */
async function owns(client: PoolClient, userId: string, characterId: string): Promise<boolean> {
  const { rowCount } = await client.query(
    'select 1 from character where id = $1 and user_id = $2',
    [characterId, userId],
  )
  return (rowCount ?? 0) > 0
}

/** Locks (creating if needed) the play row. Caller must have checked ownership. */
async function lockPlay(client: PoolClient, characterId: string) {
  await client.query(
    'insert into character_play (character_id) values ($1) on conflict do nothing',
    [characterId],
  )
  const { rows } = await client.query<{
    spent: PoolPoints
    notes: string
    inventory: InventoryItem[]
  }>('select spent, notes, inventory from character_play where character_id = $1 for update', [
    characterId,
  ])
  return rows[0]!
}

export async function getPlayData(userId: string, characterId: string): Promise<PlayData | null> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return null
    const play = await lockPlay(client, characterId)
    const { rows } = await client.query<XpRow>(
      'select id, kind, amount, reason, locked, created_at from character_xp_entry where character_id = $1 order by id',
      [characterId],
    )
    return {
      spent: { ...NO_SPENT, ...play.spent },
      notes: play.notes,
      inventory: play.inventory,
      xp: rows.map(toXp),
    }
  })
}

async function xpAvailable(client: PoolClient, characterId: string): Promise<number> {
  const { rows } = await client.query<{ total: string }>(
    `select coalesce(sum(case when kind = 'gain' then amount else -amount end), 0) as total
       from character_xp_entry where character_id = $1`,
    [characterId],
  )
  return Number(rows[0]?.total ?? 0)
}

// ---- pools ----

export type PoolChange =
  { kind: 'spend'; amount: number } | { kind: 'recover'; amount: number | 'all' }

/**
 * Spends or recovers points on one Pool, clamped to [0, max]. `max` comes from
 * the character's cached pool_max (never from the client). Returns the new
 * spent points, or null when the character isn't the user's.
 */
export async function adjustPool(
  userId: string,
  characterId: string,
  stat: PoolKey,
  change: PoolChange,
  max: number,
): Promise<PoolPoints | null> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return null
    const play = await lockPlay(client, characterId)
    const current = play.spent[stat] ?? 0
    const next =
      change.kind === 'spend'
        ? Math.min(max, current + change.amount)
        : change.amount === 'all'
          ? 0
          : Math.max(0, current - change.amount)
    // A pool max that shrank (rules change, edited build) can leave `spent` above it.
    const spent = { ...NO_SPENT, ...play.spent, [stat]: Math.min(next, max) }
    await client.query(
      'update character_play set spent = $2, updated_at = now() where character_id = $1',
      [characterId, spent],
    )
    return spent
  })
}

// ---- notes ----

export async function setNotes(
  userId: string,
  characterId: string,
  notes: string,
): Promise<boolean> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return false
    await lockPlay(client, characterId)
    await client.query(
      'update character_play set notes = $2, updated_at = now() where character_id = $1',
      [characterId, notes],
    )
    return true
  })
}

// ---- XP ----

export type XpResult =
  { ok: true; entry: XpEntry } | { ok: false; reason: 'not_found' | 'insufficient' | 'limit' }

export async function addXp(
  userId: string,
  characterId: string,
  kind: 'gain' | 'spend',
  amount: number,
  reason: string,
): Promise<XpResult> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return { ok: false, reason: 'not_found' }
    // Serialize concurrent XP writes for this character.
    await lockPlay(client, characterId)
    const { rows: count } = await client.query<{ n: string }>(
      'select count(*) as n from character_xp_entry where character_id = $1',
      [characterId],
    )
    if (Number(count[0]?.n ?? 0) >= LIMITS.xpEntries) return { ok: false, reason: 'limit' }
    if (kind === 'spend' && (await xpAvailable(client, characterId)) < amount) {
      return { ok: false, reason: 'insufficient' }
    }
    const { rows } = await client.query<XpRow>(
      `insert into character_xp_entry (character_id, kind, amount, reason)
       values ($1, $2, $3, $4)
       returning id, kind, amount, reason, locked, created_at`,
      [characterId, kind, amount, reason],
    )
    return { ok: true, entry: toXp(rows[0]!) }
  })
}

/** Removes a manual XP entry. Refuses locked ones, and removals that would leave XP negative. */
export async function removeXp(
  userId: string,
  characterId: string,
  entryId: number,
): Promise<'ok' | 'not_found' | 'locked' | 'would_go_negative'> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return 'not_found'
    await lockPlay(client, characterId)
    const { rows } = await client.query<XpRow>(
      'select id, kind, amount, locked from character_xp_entry where id = $1 and character_id = $2',
      [entryId, characterId],
    )
    const entry = rows[0]
    if (!entry) return 'not_found'
    if (entry.locked) return 'locked'
    if (entry.kind === 'gain' && (await xpAvailable(client, characterId)) - entry.amount < 0) {
      return 'would_go_negative'
    }
    await client.query('delete from character_xp_entry where id = $1', [entryId])
    return 'ok'
  })
}

// ---- inventory ----

export type InventoryResult =
  { ok: true; inventory: InventoryItem[] } | { ok: false; reason: 'not_found' | 'limit' }

async function mutateInventory(
  userId: string,
  characterId: string,
  fn: (items: InventoryItem[]) => InventoryItem[] | 'limit',
): Promise<InventoryResult> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return { ok: false, reason: 'not_found' }
    const play = await lockPlay(client, characterId)
    const next = fn(play.inventory)
    if (next === 'limit') return { ok: false, reason: 'limit' }
    await client.query(
      'update character_play set inventory = $2, updated_at = now() where character_id = $1',
      [characterId, JSON.stringify(next)],
    )
    return { ok: true, inventory: next }
  })
}

export const addItem = (userId: string, characterId: string, item: InventoryItem) =>
  mutateInventory(userId, characterId, (items) =>
    items.length >= LIMITS.items ? 'limit' : [...items, item],
  )

export const changeItemQty = (userId: string, characterId: string, itemId: string, delta: number) =>
  mutateInventory(userId, characterId, (items) =>
    items.map((it) =>
      it.id === itemId ? { ...it, qty: Math.max(0, Math.min(LIMITS.itemQty, it.qty + delta)) } : it,
    ),
  )

export const removeItem = (userId: string, characterId: string, itemId: string) =>
  mutateInventory(userId, characterId, (items) => items.filter((it) => it.id !== itemId))

// ---- advancement ----

export type AdvancementResult =
  { ok: true } | { ok: false; reason: 'not_found' | 'conflict' | 'insufficient' }

/**
 * Records one advancement purchase atomically: the character's purchases (only
 * if nobody changed them since `expected`), the refreshed derived data, and the
 * locked XP spend entry. The caller has already validated the purchase against
 * the engine; this guards the concurrent-write and XP-balance parts.
 */
export async function applyAdvancement(
  userId: string,
  characterId: string,
  args: {
    expected: AdvancementPurchaseInput[]
    next: AdvancementPurchaseInput[]
    poolMax: PoolPoints
    tier: number
    costXp: number
    reason: string
  },
): Promise<AdvancementResult> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return { ok: false, reason: 'not_found' }
    await lockPlay(client, characterId)
    if ((await xpAvailable(client, characterId)) < args.costXp) {
      return { ok: false, reason: 'insufficient' }
    }
    const { rowCount } = await client.query(
      `update character
          set advancement = $3,
              pool_max = $4,
              summary = jsonb_set(summary, '{tier}', to_jsonb($5::int)),
              updated_at = now()
        where id = $1 and user_id = $2 and advancement = $6::jsonb`,
      [
        characterId,
        userId,
        JSON.stringify(args.next),
        JSON.stringify(args.poolMax),
        args.tier,
        JSON.stringify(args.expected),
      ],
    )
    if ((rowCount ?? 0) === 0) return { ok: false, reason: 'conflict' }
    await client.query(
      `insert into character_xp_entry (character_id, kind, amount, reason, locked)
       values ($1, 'spend', $2, $3, true)`,
      [characterId, args.costXp, args.reason],
    )
    return { ok: true }
  })
}

/** Refreshes the cached maximums (used when the play page re-derives and they drifted). */
export async function setPoolMax(userId: string, characterId: string, poolMax: PoolPoints) {
  await pool.query('update character set pool_max = $3 where id = $1 and user_id = $2', [
    characterId,
    userId,
    JSON.stringify(poolMax),
  ])
}
