import { STEPS } from '@/components/wizard/state'
import { buildCharacterChoicesInput, isStepValid } from '@/components/wizard/derive'
import type { CharacterData } from '@/lib/characters'
import { parseChoices } from '@/lib/characters-input'
import {
  fetchAbilities,
  fetchDescriptors,
  fetchFlavors,
  fetchFoci,
  fetchTypes,
  validateCharacterChoices,
  type AdvancementPurchaseInput,
} from '@/lib/graphql/queries'
import { EMPTY_PICKS, flavorIdInUse, type TierPicks } from '@/lib/tier-picks'
import { fetchContentVersions } from '@/lib/graphql/versions'

/**
 * Rule errors that mean the edit took away what an advancement depends on: an
 * ability bought as an Other Option, or one a Skills purchase trained. The
 * player has to undo that advancement in play mode first.
 */
const ADVANCEMENT_CONFLICTS = new Set([
  'ADVANCEMENT_ABILITY_NOT_OFFERED',
  'ADVANCEMENT_ABILITY_KNOWN',
  'ADVANCEMENT_FOCUS_OPTION_INVALID',
  'ADVANCEMENT_FOCUS_FIRST_CHOICE_MISSING',
  'ABILITY_TRAINING_UNKNOWN',
])

/**
 * Turns untrusted wizard state into the row we store, or says why not.
 * Re-checks the shape, every wizard step, and finally asks the rules API
 * whether the choices make a legal character. Throws if the API is down.
 */
export async function prepareCharacterData(
  rawChoices: unknown,
  advancement: AdvancementPurchaseInput[] = [],
  tierPicks: TierPicks = EMPTY_PICKS,
): Promise<{ ok: true; data: CharacterData } | { ok: false; advancementConflict?: true }> {
  const choices = parseChoices(rawChoices)
  if (!choices) return { ok: false }

  const [types, descriptors, foci, flavors, abilities, versions] = await Promise.all([
    fetchTypes(),
    fetchDescriptors(),
    fetchFoci(),
    fetchFlavors(),
    fetchAbilities(),
    fetchContentVersions(),
  ])
  const type = types.find((t) => t.id === choices.typeId)
  const descriptor = descriptors.find((d) => d.id === choices.descriptorId)
  const focus = foci.find((f) => f.id === choices.focusId)
  const flavorId = flavorIdInUse(choices, tierPicks)
  const flavor = flavorId ? flavors.find((f) => f.id === flavorId) : undefined
  const content = { type, descriptor, focus, flavor, abilities }

  if (!type || !descriptor || !focus) return { ok: false }
  if (flavorId && !flavor) return { ok: false }
  if (!STEPS.every((step) => isStepValid(step.id, choices, content))) return { ok: false }

  const input = buildCharacterChoicesInput(choices, content, advancement, tierPicks)
  if (!input) return { ok: false }
  const result = await validateCharacterChoices(input)
  if (result.__typename !== 'ValidCharacterResult') {
    return result.issues.some((issue) => ADVANCEMENT_CONFLICTS.has(issue.code))
      ? { ok: false, advancementConflict: true }
      : { ok: false }
  }

  return {
    ok: true,
    data: {
      name: choices.name,
      choices,
      tierPicks,
      poolMax: {
        might: result.character.pools.might.max,
        speed: result.character.pools.speed.max,
        intellect: result.character.pools.intellect.max,
      },
      summary: {
        typeName: type.name,
        descriptorName: descriptor.name,
        focusName: focus.name,
        tier: result.character.tier,
      },
      contentVersions: Object.fromEntries(
        [type.id, descriptor.id, focus.id, ...(flavor ? [flavor.id] : [])].flatMap((key) => {
          const v = versions.get(key)
          return v ? [[key, v]] : []
        }),
      ),
    },
  }
}
