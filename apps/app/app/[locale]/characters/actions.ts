'use server'

import { revalidatePath } from 'next/cache'

import {
  CharacterLimitError,
  createCharacter,
  getCharacter,
  deleteCharacter as removeCharacter,
  updateCharacter,
} from '@/lib/characters'
import { prepareCharacterData } from '@/lib/prepare-character'
import { EMPTY_PICKS, isEmptyPicks } from '@/lib/tier-picks'
import { getSession } from '@/lib/session'

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'unauthorized' | 'invalid' | 'limit' | 'unavailable' }

/**
 * Creates (no `id`) or updates (`id`) a saved character. Nothing the browser
 * sends is trusted: the shape is re-parsed, every wizard step is re-checked,
 * and the choices are re-validated by the rules API before anything is stored.
 */
export async function saveCharacter(rawChoices: unknown, id?: string): Promise<SaveResult> {
  const session = await getSession()
  if (!session) return { ok: false, reason: 'unauthorized' }

  try {
    // Editing the build keeps the advancement already purchased, so the new
    // choices are validated together with it.
    const existing = id ? await getCharacter(session.user.id, id) : null
    if (id && !existing) return { ok: false, reason: 'invalid' }
    // The level-up picks (Type abilities from tier 2, a Focus choice) are kept
    // too. If the edit makes them impossible (a different Type or Focus, or a
    // tier-1 ability now taken twice), drop them: the player is asked again.
    let prepared = await prepareCharacterData(
      rawChoices,
      existing?.advancement ?? [],
      existing?.tierPicks,
    )
    if (!prepared.ok && existing && !isEmptyPicks(existing.tierPicks)) {
      prepared = await prepareCharacterData(rawChoices, existing.advancement, EMPTY_PICKS)
    }
    if (!prepared.ok) return { ok: false, reason: 'invalid' }
    const { data } = prepared

    let savedId: string
    if (id) {
      if (!(await updateCharacter(session.user.id, id, data))) {
        return { ok: false, reason: 'invalid' }
      }
      savedId = id
    } else {
      savedId = await createCharacter(session.user.id, data)
    }

    revalidatePath('/[locale]', 'page')
    return { ok: true, id: savedId }
  } catch (err) {
    if (err instanceof CharacterLimitError) return { ok: false, reason: 'limit' }
    console.error('[characters] save failed:', err)
    return { ok: false, reason: 'unavailable' }
  }
}

export async function deleteCharacter(id: string): Promise<{ ok: boolean }> {
  const session = await getSession()
  if (!session) return { ok: false }

  const ok = await removeCharacter(session.user.id, id)
  if (ok) revalidatePath('/[locale]', 'page')
  return { ok }
}
