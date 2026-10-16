import type { PoolClient } from 'pg'

import { pool } from '@/lib/db'
import type { TierPicks } from '@/lib/tier-picks'
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

export interface NoteEntry {
  id: number
  body: string
  createdAt: Date
}

export interface PlayData {
  spent: PoolPoints
  notes: NoteEntry[]
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
  notes: 200,
  noteLength: 500,
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

interface NoteRow {
  id: string
  body: string
  created_at: Date
}

const toNote = (r: NoteRow): NoteEntry => ({
  id: Number(r.id),
  body: r.body,
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
    inventory: InventoryItem[]
  }>('select spent, inventory from character_play where character_id = $1 for update', [
    characterId,
  ])
  return rows[0]!
}

/**
 * Read-only, so no transaction and no row lock: the three reads run in
 * parallel (one database round trip instead of eight in a row), each scoped
 * to the user through a join on `character`. A character whose play row
 * hasn't been created yet (`lockPlay` creates it on the first write) reads as
 * the defaults.
 */
export async function getPlayData(userId: string, characterId: string): Promise<PlayData | null> {
  const [play, xp, notes] = await Promise.all([
    pool.query<{ spent: PoolPoints | null; inventory: InventoryItem[] | null }>(
      `select p.spent, p.inventory
         from character c left join character_play p on p.character_id = c.id
        where c.id = $1 and c.user_id = $2`,
      [characterId, userId],
    ),
    pool.query<XpRow>(
      `select x.id, x.kind, x.amount, x.reason, x.locked, x.created_at
         from character_xp_entry x join character c on c.id = x.character_id
        where x.character_id = $1 and c.user_id = $2
        order by x.id`,
      [characterId, userId],
    ),
    pool.query<NoteRow>(
      `select n.id, n.body, n.created_at
         from character_note n join character c on c.id = n.character_id
        where n.character_id = $1 and c.user_id = $2
        order by n.id`,
      [characterId, userId],
    ),
  ])
  // No row: the character doesn't exist or isn't this user's.
  const row = play.rows[0]
  if (!row) return null
  return {
    spent: { ...NO_SPENT, ...row.spent },
    notes: notes.rows.map(toNote),
    inventory: row.inventory ?? [],
    xp: xp.rows.map(toXp),
  }
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

export async function addNote(
  userId: string,
  characterId: string,
  body: string,
): Promise<{ ok: true; note: NoteEntry } | { ok: false; reason: 'not_found' | 'limit' }> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return { ok: false, reason: 'not_found' }
    // Serialize concurrent note writes for this character.
    await lockPlay(client, characterId)
    const { rows: count } = await client.query<{ n: string }>(
      'select count(*) as n from character_note where character_id = $1',
      [characterId],
    )
    if (Number(count[0]?.n ?? 0) >= LIMITS.notes) return { ok: false, reason: 'limit' }
    const { rows } = await client.query<NoteRow>(
      `insert into character_note (character_id, body) values ($1, $2)
       returning id, body, created_at`,
      [characterId, body],
    )
    return { ok: true, note: toNote(rows[0]!) }
  })
}

export async function updateNote(
  userId: string,
  characterId: string,
  noteId: number,
  body: string,
): Promise<boolean> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return false
    const { rowCount } = await client.query(
      'update character_note set body = $3 where id = $1 and character_id = $2',
      [noteId, characterId, body],
    )
    return (rowCount ?? 0) > 0
  })
}

export async function removeNote(
  userId: string,
  characterId: string,
  noteId: number,
): Promise<boolean> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return false
    const { rowCount } = await client.query(
      'delete from character_note where id = $1 and character_id = $2',
      [noteId, characterId],
    )
    return (rowCount ?? 0) > 0
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

export type RevertResult = { ok: true } | { ok: false; reason: 'not_found' | 'conflict' }

/**
 * Undoes one advancement: stores the build without the purchase (and with the
 * level-up picks that no longer apply removed), refunds its XP as an ordinary
 * entry, and caps the spent Pool points at the new maximums. As with
 * `applyAdvancement`, the caller has validated the result against the engine;
 * this guards the concurrent-write part.
 */
export async function revertAdvancement(
  userId: string,
  characterId: string,
  args: {
    expected: AdvancementPurchaseInput[]
    next: AdvancementPurchaseInput[]
    expectedPicks: TierPicks
    nextPicks: TierPicks
    poolMax: PoolPoints
    tier: number
    refundXp: number
    reason: string
  },
): Promise<RevertResult> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return { ok: false, reason: 'not_found' }
    const play = await lockPlay(client, characterId)
    const { rowCount } = await client.query(
      `update character
          set advancement = $3,
              tier_picks = $4,
              pool_max = $5,
              summary = jsonb_set(summary, '{tier}', to_jsonb($6::int)),
              updated_at = now()
        where id = $1 and user_id = $2
          and advancement = $7::jsonb and tier_picks = $8::jsonb`,
      [
        characterId,
        userId,
        JSON.stringify(args.next),
        JSON.stringify(args.nextPicks),
        JSON.stringify(args.poolMax),
        args.tier,
        JSON.stringify(args.expected),
        JSON.stringify(args.expectedPicks),
      ],
    )
    if ((rowCount ?? 0) === 0) return { ok: false, reason: 'conflict' }

    // A lower maximum can't leave more points spent than the Pool holds.
    const spent = Object.fromEntries(
      POOL_KEYS.map((key) => [key, Math.min(play.spent[key], args.poolMax[key])]),
    )
    await client.query(
      'update character_play set spent = $2, updated_at = now() where character_id = $1',
      [characterId, JSON.stringify(spent)],
    )
    await client.query(
      `insert into character_xp_entry (character_id, kind, amount, reason)
       values ($1, 'gain', $2, $3)`,
      [characterId, args.refundXp, args.reason],
    )
    return { ok: true }
  })
}

export type PicksPurchaseResult =
  { ok: true } | { ok: false; reason: 'not_found' | 'conflict' | 'insufficient' }

/**
 * Records something bought for XP that lives in the picks (cantrips, a flavor
 * gained in play): the new picks (only if nobody changed them since
 * `expectedPicks`) and the locked XP spend entry, together. A `costXp` of 0 (a
 * flavor granted by a character arc) writes the picks and no entry, since the
 * ledger only holds positive amounts. The caller has already validated the
 * resulting build against the engine.
 */
export async function applyPicksPurchase(
  userId: string,
  characterId: string,
  args: { expectedPicks: TierPicks; nextPicks: TierPicks; costXp: number; reason: string },
): Promise<PicksPurchaseResult> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return { ok: false, reason: 'not_found' }
    await lockPlay(client, characterId)
    if ((await xpAvailable(client, characterId)) < args.costXp) {
      return { ok: false, reason: 'insufficient' }
    }
    const { rowCount } = await client.query(
      `update character set tier_picks = $3, updated_at = now()
        where id = $1 and user_id = $2 and tier_picks = $4::jsonb`,
      [characterId, userId, JSON.stringify(args.nextPicks), JSON.stringify(args.expectedPicks)],
    )
    if ((rowCount ?? 0) === 0) return { ok: false, reason: 'conflict' }
    if (args.costXp > 0) {
      await client.query(
        `insert into character_xp_entry (character_id, kind, amount, reason, locked)
         values ($1, 'spend', $2, $3, true)`,
        [characterId, args.costXp, args.reason],
      )
    }
    return { ok: true }
  })
}

/** Undoes `applyPicksPurchase`: stores the picks without the purchase and refunds its XP as an ordinary entry. */
export async function revertPicksPurchase(
  userId: string,
  characterId: string,
  args: { expectedPicks: TierPicks; nextPicks: TierPicks; refundXp: number; reason: string },
): Promise<RevertResult> {
  return tx(async (client) => {
    if (!(await owns(client, userId, characterId))) return { ok: false, reason: 'not_found' }
    await lockPlay(client, characterId)
    const { rowCount } = await client.query(
      `update character set tier_picks = $3, updated_at = now()
        where id = $1 and user_id = $2 and tier_picks = $4::jsonb`,
      [characterId, userId, JSON.stringify(args.nextPicks), JSON.stringify(args.expectedPicks)],
    )
    if ((rowCount ?? 0) === 0) return { ok: false, reason: 'conflict' }
    if (args.refundXp > 0) {
      await client.query(
        `insert into character_xp_entry (character_id, kind, amount, reason)
         values ($1, 'gain', $2, $3)`,
        [characterId, args.refundXp, args.reason],
      )
    }
    return { ok: true }
  })
}

/**
 * Replaces the level-up picks, but only if nobody changed them since `expected`.
 * Returns false on a conflict (or when the character isn't the user's).
 */
export async function setTierPicks(
  userId: string,
  characterId: string,
  expected: TierPicks,
  next: TierPicks,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `update character set tier_picks = $3, updated_at = now()
      where id = $1 and user_id = $2 and tier_picks = $4::jsonb`,
    [characterId, userId, JSON.stringify(next), JSON.stringify(expected)],
  )
  return (rowCount ?? 0) > 0
}

/** Refreshes the cached maximums (used when the play page re-derives and they drifted). */
export async function setPoolMax(userId: string, characterId: string, poolMax: PoolPoints) {
  await pool.query('update character set pool_max = $3 where id = $1 and user_id = $2', [
    characterId,
    userId,
    JSON.stringify(poolMax),
  ])
}
