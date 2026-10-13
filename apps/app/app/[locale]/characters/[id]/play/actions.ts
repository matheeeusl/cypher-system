'use server'

import { revalidatePath } from 'next/cache'

import {
  atMaxTier,
  boughtAtTier,
  choiceOf,
  parseChoice,
  revertableIndexes,
  tierOf,
  toPurchase,
} from '@/lib/advancement'
import { advancementReason } from '@/lib/advancement-reason'
import { loadDerived } from '@/lib/character-derived'
import { getCharacter } from '@/lib/characters'
import { buildCharacterChoicesInput } from '@/components/wizard/derive'
import { fetchCypher } from '@/lib/graphql/cyphers'
import { fetchAdvancementRules, validateCharacterChoices, type Stat } from '@/lib/graphql/queries'
import { isLocale, type Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import { playCopy } from '@/lib/i18n/play'
import { terms } from '@/lib/i18n/terms'
import {
  LIMITS,
  POOL_KEYS,
  addItem,
  addXp,
  adjustPool,
  applyAdvancement,
  changeItemQty,
  getPlayData,
  removeItem,
  removeXp,
  revertAdvancement,
  setNotes,
  setPoolMax,
  setTierPicks,
  type InventoryItem,
  type PoolChange,
  type PoolKey,
  type PoolPoints,
} from '@/lib/play'
import { buildPlayView, type PlayView } from '@/lib/play-view'
import { getSession } from '@/lib/session'
import { customSkillText, isCustomSkill, isSkillIdShape } from '@/lib/custom-skill'
import { picksUpToTier, withPick, withSkillPick } from '@/lib/tier-picks'

// Every action: verify the session, validate every argument (they arrive from
// the browser), and let lib/play.ts scope the query to the session user.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const isText = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max

type Fail<R extends string = 'invalid'> = {
  ok: false
  reason: R | 'unauthorized' | 'not_found' | 'invalid' | 'unavailable'
}

async function userId(): Promise<string | null> {
  return (await getSession())?.user.id ?? null
}

function touch(characterId: string) {
  revalidatePath('/[locale]/characters/[id]', 'page')
  void characterId
}

// ---- pools ----

export async function adjustPoolAction(
  characterId: unknown,
  stat: unknown,
  change: unknown,
): Promise<{ ok: true; spent: PoolPoints } | Fail> {
  const uid = await userId()
  if (!uid) return { ok: false, reason: 'unauthorized' }
  if (typeof characterId !== 'string' || !UUID.test(characterId))
    return { ok: false, reason: 'invalid' }
  if (typeof stat !== 'string' || !POOL_KEYS.includes(stat as PoolKey))
    return { ok: false, reason: 'invalid' }

  const c = change as { kind?: unknown; amount?: unknown } | null
  let parsed: PoolChange
  if (c?.kind === 'spend' && isInt(c.amount, 1, 100)) parsed = { kind: 'spend', amount: c.amount }
  else if (c?.kind === 'recover' && (c.amount === 'all' || isInt(c.amount, 1, 100)))
    parsed = { kind: 'recover', amount: c.amount as number | 'all' }
  else return { ok: false, reason: 'invalid' }

  try {
    const character = await getCharacter(uid, characterId)
    if (!character) return { ok: false, reason: 'not_found' }

    // The cached maximum is filled on save/advancement; characters saved before
    // play mode existed get it lazily here.
    let poolMax = character.poolMax
    if (!poolMax) {
      const bundle = await loadDerived(character)
      if (!bundle) return { ok: false, reason: 'invalid' }
      poolMax = {
        might: bundle.derived.pools.might.max,
        speed: bundle.derived.pools.speed.max,
        intellect: bundle.derived.pools.intellect.max,
      }
      await setPoolMax(uid, characterId, poolMax)
    }

    const spent = await adjustPool(
      uid,
      characterId,
      stat as PoolKey,
      parsed,
      poolMax[stat as PoolKey],
    )
    return spent ? { ok: true, spent } : { ok: false, reason: 'not_found' }
  } catch (err) {
    console.error('[play] adjustPool failed:', err)
    return { ok: false, reason: 'unavailable' }
  }
}

// ---- notes ----

export async function setNotesAction(
  characterId: unknown,
  notes: unknown,
): Promise<{ ok: boolean }> {
  const uid = await userId()
  if (!uid || typeof characterId !== 'string' || !UUID.test(characterId)) return { ok: false }
  if (typeof notes !== 'string' || notes.length > LIMITS.notes) return { ok: false }
  try {
    return { ok: await setNotes(uid, characterId, notes) }
  } catch (err) {
    console.error('[play] setNotes failed:', err)
    return { ok: false }
  }
}

// ---- XP ----

export async function addXpAction(
  characterId: unknown,
  input: unknown,
): Promise<
  | {
      ok: true
      entry: { id: number; kind: 'gain' | 'spend'; amount: number; reason: string; locked: boolean }
    }
  | Fail<'insufficient' | 'limit'>
> {
  const uid = await userId()
  if (!uid) return { ok: false, reason: 'unauthorized' }
  const i = input as { kind?: unknown; amount?: unknown; reason?: unknown } | null
  if (
    typeof characterId !== 'string' ||
    !UUID.test(characterId) ||
    (i?.kind !== 'gain' && i?.kind !== 'spend') ||
    !isInt(i.amount, 1, LIMITS.xpAmount) ||
    !isText(i.reason, LIMITS.reason)
  ) {
    return { ok: false, reason: 'invalid' }
  }
  try {
    const result = await addXp(uid, characterId, i.kind, i.amount, i.reason.trim())
    if (!result.ok) return { ok: false, reason: result.reason }
    const { id, kind, amount, reason, locked } = result.entry
    return { ok: true, entry: { id, kind, amount, reason, locked } }
  } catch (err) {
    console.error('[play] addXp failed:', err)
    return { ok: false, reason: 'unavailable' }
  }
}

export async function removeXpAction(
  characterId: unknown,
  entryId: unknown,
): Promise<
  | { ok: true }
  | {
      ok: false
      reason:
        'locked' | 'would_go_negative' | 'not_found' | 'invalid' | 'unauthorized' | 'unavailable'
    }
> {
  const uid = await userId()
  if (!uid) return { ok: false, reason: 'unauthorized' }
  if (
    typeof characterId !== 'string' ||
    !UUID.test(characterId) ||
    !isInt(entryId, 1, Number.MAX_SAFE_INTEGER)
  ) {
    return { ok: false, reason: 'invalid' }
  }
  try {
    const result = await removeXp(uid, characterId, entryId)
    return result === 'ok' ? { ok: true } : { ok: false, reason: result }
  } catch (err) {
    console.error('[play] removeXp failed:', err)
    return { ok: false, reason: 'unavailable' }
  }
}

// ---- inventory ----

type InventoryOutcome = { ok: true; inventory: InventoryItem[] } | Fail<'limit'>

async function inventoryOp(
  characterId: unknown,
  run: (uid: string, id: string) => ReturnType<typeof addItem>,
): Promise<InventoryOutcome> {
  const uid = await userId()
  if (!uid) return { ok: false, reason: 'unauthorized' }
  if (typeof characterId !== 'string' || !UUID.test(characterId))
    return { ok: false, reason: 'invalid' }
  try {
    const result = await run(uid, characterId)
    return result.ok
      ? { ok: true, inventory: result.inventory }
      : { ok: false, reason: result.reason }
  } catch (err) {
    console.error('[play] inventory failed:', err)
    return { ok: false, reason: 'unavailable' }
  }
}

export async function addItemAction(
  characterId: unknown,
  input: unknown,
): Promise<InventoryOutcome> {
  const i = input as { name?: unknown; meta?: unknown; defaultMeta?: unknown } | null
  if (!isText(i?.name, LIMITS.itemName)) return { ok: false, reason: 'invalid' }
  const meta = typeof i?.meta === 'string' ? i.meta.trim() : ''
  const fallback = isText(i?.defaultMeta, LIMITS.itemMeta) ? i.defaultMeta.trim() : 'Gear'
  if (meta.length > LIMITS.itemMeta) return { ok: false, reason: 'invalid' }
  const item: InventoryItem = {
    id: crypto.randomUUID(),
    kind: 'item',
    name: i.name.trim(),
    meta: meta || fallback,
    qty: 1,
  }
  return inventoryOp(characterId, (uid, id) => addItem(uid, id, item))
}

export async function addCypherAction(
  characterId: unknown,
  cypherId: unknown,
): Promise<InventoryOutcome> {
  if (typeof cypherId !== 'string' || cypherId.length === 0 || cypherId.length > 100) {
    return { ok: false, reason: 'invalid' }
  }
  // The name/level come from the rules API, never from the browser.
  let cypher
  try {
    cypher = await fetchCypher(cypherId)
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
  if (!cypher) return { ok: false, reason: 'invalid' }
  const item: InventoryItem = {
    id: crypto.randomUUID(),
    kind: 'cypher',
    cypherId: cypher.id,
    name: cypher.name,
    category: cypher.category,
    level: cypher.levelRange,
    qty: 1,
  }
  return inventoryOp(characterId, (uid, id) => addItem(uid, id, item))
}

export async function changeItemQtyAction(
  characterId: unknown,
  itemId: unknown,
  delta: unknown,
): Promise<InventoryOutcome> {
  if (typeof itemId !== 'string' || !UUID.test(itemId) || (delta !== 1 && delta !== -1)) {
    return { ok: false, reason: 'invalid' }
  }
  return inventoryOp(characterId, (uid, id) => changeItemQty(uid, id, itemId, delta))
}

export async function removeItemAction(
  characterId: unknown,
  itemId: unknown,
): Promise<InventoryOutcome> {
  if (typeof itemId !== 'string' || !UUID.test(itemId)) return { ok: false, reason: 'invalid' }
  return inventoryOp(characterId, (uid, id) => removeItem(uid, id, itemId))
}

// ---- advancement ----

export type PurchaseResult =
  | { ok: true; tier: number; tierUp: boolean; view: PlayView | null }
  | {
      ok: false
      reason:
        | 'unauthorized'
        | 'invalid'
        | 'not_found'
        | 'insufficient'
        | 'conflict'
        | 'capped'
        | 'unavailable'
    }

/**
 * Buys one advancement. The browser only says *which* option and its choice;
 * the server works out the tier, checks the once-per-tier and XP rules, asks the
 * engine (through graphql-api) whether the resulting build is valid, and then
 * records the purchase and its locked XP entry in one transaction.
 */
export async function purchaseAdvancementAction(
  characterId: unknown,
  rawChoice: unknown,
  locale: unknown,
): Promise<PurchaseResult> {
  const uid = await userId()
  if (!uid) return { ok: false, reason: 'unauthorized' }
  const parsed = parseChoice(rawChoice)
  if (
    typeof characterId !== 'string' ||
    !UUID.test(characterId) ||
    !parsed ||
    typeof locale !== 'string' ||
    !isLocale(locale)
  ) {
    return { ok: false, reason: 'invalid' }
  }
  const choice = parsed

  try {
    const character = await getCharacter(uid, characterId)
    if (!character) return { ok: false, reason: 'not_found' }

    const [rules, bundle] = await Promise.all([fetchAdvancementRules(), loadDerived(character)])
    if (!bundle) return { ok: false, reason: 'invalid' }

    const tier = bundle.derived.tier
    // Purchases are tagged with the tier they lead to.
    const target = tier + 1
    const bought = boughtAtTier(character.advancement, target)
    if (bought.has(choice.key)) return { ok: false, reason: 'invalid' }
    if (atMaxTier(tier, rules.maxTier)) return { ok: false, reason: 'capped' }
    let skillIdOverride: string | undefined
    if (choice.key === 'skills') {
      // A catalog skill, or one the player types (new, or one this character
      // already has, in which case its existing entry is the one raised).
      const exists =
        'skillId' in choice
          ? isCustomSkill(choice.skillId)
            ? isSkillIdShape(choice.skillId)
            : bundle.skills.some((s) => s.id === choice.skillId)
          : bundle.derived.knownAbilities.some((a) => a.abilityId === choice.abilityId) &&
            // The Skills advancement trains an ability only if it's an attack.
            bundle.abilities.some((a) => a.id === choice.abilityId && a.attack)
      if (!exists) return { ok: false, reason: 'invalid' }
      if ('skillId' in choice && isCustomSkill(choice.skillId)) {
        const typed = choice.skillId.toLowerCase().replace(/\s+/g, ' ')
        const have = bundle.derived.skills.find(
          (s) => isCustomSkill(s.skillId) && s.skillId.toLowerCase().replace(/\s+/g, ' ') === typed,
        )
        if (have) skillIdOverride = have.skillId
      }
    }

    // A typed skill matches the character's existing entry, ignoring case.
    const effective =
      skillIdOverride !== undefined && choice.key === 'skills'
        ? { ...choice, skillId: skillIdOverride }
        : choice
    const next = [...character.advancement, toPurchase(effective, target)]
    const input = buildCharacterChoicesInput(
      character.choices,
      {
        type: bundle.type,
        descriptor: bundle.descriptor,
        focus: bundle.focus,
        abilities: bundle.abilities,
      },
      next,
      character.tierPicks,
    )
    if (!input) return { ok: false, reason: 'invalid' }
    const result = await validateCharacterChoices(input)
    if (result.__typename !== 'ValidCharacterResult') return { ok: false, reason: 'invalid' }

    const reason = advancementReason(locale, choice, bundle)
    const applied = await applyAdvancement(uid, characterId, {
      expected: character.advancement,
      next,
      poolMax: {
        might: result.character.pools.might.max,
        speed: result.character.pools.speed.max,
        intellect: result.character.pools.intellect.max,
      },
      tier: result.character.tier,
      costXp: rules.costXp,
      reason,
    })
    if (!applied.ok) return { ok: false, reason: applied.reason }

    touch(characterId)
    // Hand the screen its fresh derived data (new Pool maximums, Effort, skills,
    // XP entry…) so it doesn't depend on re-fetching the page.
    return {
      ok: true,
      tier: result.character.tier,
      tierUp: result.character.tier > tier,
      view: await freshView(uid, characterId, locale),
    }
  } catch (err) {
    console.error('[play] purchaseAdvancement failed:', err)
    return { ok: false, reason: 'unavailable' }
  }
}

// ---- undoing an advancement ----

export type RevertAdvancementResult =
  { ok: true; view: PlayView | null } | Fail<'conflict' | 'not_revertable'>

/**
 * Undoes one advancement purchase. Only the newest tier's purchases can go
 * (`revertableIndexes`); the result is checked against the engine, the XP it
 * cost is refunded as an entry in the log, and level-up picks that belonged to
 * a tier the character no longer has are dropped.
 */
export async function revertAdvancementAction(
  characterId: unknown,
  index: unknown,
  locale: unknown,
): Promise<RevertAdvancementResult> {
  const uid = await userId()
  if (!uid) return { ok: false, reason: 'unauthorized' }
  if (
    typeof characterId !== 'string' ||
    !UUID.test(characterId) ||
    !isInt(index, 0, 1000) ||
    typeof locale !== 'string' ||
    !isLocale(locale)
  ) {
    return { ok: false, reason: 'invalid' }
  }

  try {
    const character = await getCharacter(uid, characterId)
    if (!character) return { ok: false, reason: 'not_found' }
    const [rules, bundle] = await Promise.all([fetchAdvancementRules(), loadDerived(character)])
    if (!bundle) return { ok: false, reason: 'invalid' }

    const purchases = character.advancement
    const purchase = purchases[index]
    if (!purchase || !revertableIndexes(purchases).includes(index)) {
      return { ok: false, reason: 'not_revertable' }
    }

    const next = purchases.filter((_, i) => i !== index)
    const tier = tierOf(next, rules.perTier)
    const nextPicks = picksUpToTier(character.tierPicks, tier)
    const input = buildCharacterChoicesInput(
      character.choices,
      {
        type: bundle.type,
        descriptor: bundle.descriptor,
        focus: bundle.focus,
        abilities: bundle.abilities,
      },
      next,
      nextPicks,
    )
    if (!input) return { ok: false, reason: 'invalid' }
    const result = await validateCharacterChoices(input)
    // e.g. the purchase trained an ability a later pick still depends on
    if (result.__typename !== 'ValidCharacterResult') return { ok: false, reason: 'not_revertable' }

    const refundPrefix = playCopy[locale].advancement.refundPrefix
    const reason = `${refundPrefix} — ${advancementReason(locale, choiceOf(purchase), bundle)}`
    const reverted = await revertAdvancement(uid, characterId, {
      expected: purchases,
      next,
      expectedPicks: character.tierPicks,
      nextPicks,
      poolMax: {
        might: result.character.pools.might.max,
        speed: result.character.pools.speed.max,
        intellect: result.character.pools.intellect.max,
      },
      tier: result.character.tier,
      refundXp: rules.costXp,
      reason: reason.slice(0, LIMITS.reason),
    })
    if (!reverted.ok) return { ok: false, reason: reverted.reason }

    touch(characterId)
    return { ok: true, view: await freshView(uid, characterId, locale) }
  } catch (err) {
    console.error('[play] revertAdvancement failed:', err)
    return { ok: false, reason: 'unavailable' }
  }
}

// ---- level-up picks ----

export type PicksResult = { ok: true; view: PlayView | null } | Fail<'conflict'>

/**
 * Saves the Type abilities (or Focus choice) a character owes for a tier it
 * has reached. `optionIds` are the options the player ticked — a bundled pair
 * arrives as "a,b". Which picks are owed, and whether these are legal, is
 * decided by the engine through graphql-api; nothing here trusts the browser.
 */
export async function choosePicksAction(
  characterId: unknown,
  kind: unknown,
  tier: unknown,
  optionIds: unknown,
  locale: unknown,
  skillKey?: unknown,
): Promise<PicksResult> {
  const uid = await userId()
  if (!uid) return { ok: false, reason: 'unauthorized' }
  if (
    typeof characterId !== 'string' ||
    !UUID.test(characterId) ||
    (kind !== 'type' && kind !== 'focus' && kind !== 'skill') ||
    // Skill picks can be owed from tier 1 (an ability taken at creation).
    !isInt(tier, kind === 'skill' ? 1 : 2, 6) ||
    (kind === 'skill' &&
      !(typeof skillKey === 'string' && /^(type|focus):[1-6]:[a-z0-9-]{1,100}$/.test(skillKey))) ||
    !Array.isArray(optionIds) ||
    optionIds.length === 0 ||
    optionIds.length > 10 ||
    !optionIds.every((o) => typeof o === 'string' && o.length > 0 && o.length < 200) ||
    typeof locale !== 'string' ||
    !isLocale(locale)
  ) {
    return { ok: false, reason: 'invalid' }
  }

  try {
    const character = await getCharacter(uid, characterId)
    if (!character) return { ok: false, reason: 'not_found' }
    const bundle = await loadDerived(character)
    if (!bundle) return { ok: false, reason: 'invalid' }

    // Only a pick that is actually owed, and only all of it at once.
    const owed = bundle.derived.pendingPicks.find(
      (p) => p.kind === kind && p.tier === tier && (kind !== 'skill' || p.key === skillKey),
    )
    if (!owed) return { ok: false, reason: 'invalid' }
    // A bundled Focus option arrives as "a,b"; a typed skill may contain commas.
    const ids =
      kind === 'skill'
        ? (optionIds as string[])
        : (optionIds as string[]).flatMap((o) => o.split(','))
    if (kind === 'type' && ids.length !== owed.required - owed.chosen) {
      return { ok: false, reason: 'invalid' }
    }
    if (kind === 'skill') {
      // All of the grant's skills at once, each one a real skill.
      // Either of the ability's shapes ("two skills, or specialized in one").
      if (
        !ids.every(isSkillIdShape) ||
        (ids.length !== owed.required && ids.length !== owed.alternateRequired)
      ) {
        return { ok: false, reason: 'invalid' }
      }
      // Each a catalog skill, or the player's own typed one (the engine checks
      // the ability allows that, and the graphql API the rest).
      if (!ids.every((id) => isCustomSkill(id) || bundle.skills.some((s) => s.id === id))) {
        return { ok: false, reason: 'invalid' }
      }
    }

    const picks =
      kind === 'skill'
        ? withSkillPick(character.tierPicks, skillKey as string, ids)
        : withPick(character.tierPicks, kind, tier, ids)
    const input = buildCharacterChoicesInput(
      character.choices,
      {
        type: bundle.type,
        descriptor: bundle.descriptor,
        focus: bundle.focus,
        abilities: bundle.abilities,
      },
      character.advancement,
      picks,
    )
    if (!input) return { ok: false, reason: 'invalid' }
    const result = await validateCharacterChoices(input)
    if (result.__typename !== 'ValidCharacterResult') return { ok: false, reason: 'invalid' }

    const saved = await setTierPicks(uid, characterId, character.tierPicks, picks)
    if (!saved) return { ok: false, reason: 'conflict' }

    touch(characterId)
    return { ok: true, view: await freshView(uid, characterId, locale) }
  } catch (err) {
    console.error('[play] choosePicks failed:', err)
    return { ok: false, reason: 'unavailable' }
  }
}

async function freshView(
  uid: string,
  characterId: string,
  locale: Locale,
): Promise<PlayView | null> {
  try {
    const [character, play] = await Promise.all([
      getCharacter(uid, characterId),
      getPlayData(uid, characterId),
    ])
    if (!character || !play) return null
    const bundle = await loadDerived(character)
    return bundle ? await buildPlayView(character, bundle, play, locale) : null
  } catch {
    return null
  }
}
