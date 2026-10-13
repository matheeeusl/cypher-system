import { STEPS } from '@/components/wizard/state'
import { buildCharacterChoicesInput, isStepValid } from '@/components/wizard/derive'
import type { CharacterData } from '@/lib/characters'
import { parseChoices } from '@/lib/characters-input'
import {
  fetchDescriptors,
  fetchFoci,
  fetchTypes,
  validateCharacterChoices,
} from '@/lib/graphql/queries'
import { fetchContentVersions } from '@/lib/graphql/versions'

/**
 * Turns untrusted wizard state into the row we store, or says why not.
 * Re-checks the shape, every wizard step, and finally asks the rules API
 * whether the choices make a legal character. Throws if the API is down.
 */
export async function prepareCharacterData(
  rawChoices: unknown,
): Promise<{ ok: true; data: CharacterData } | { ok: false }> {
  const choices = parseChoices(rawChoices)
  if (!choices) return { ok: false }

  const [types, descriptors, foci, versions] = await Promise.all([
    fetchTypes(),
    fetchDescriptors(),
    fetchFoci(),
    fetchContentVersions(),
  ])
  const type = types.find((t) => t.id === choices.typeId)
  const descriptor = descriptors.find((d) => d.id === choices.descriptorId)
  const focus = foci.find((f) => f.id === choices.focusId)
  const content = { type, descriptor, focus }

  if (!type || !descriptor || !focus) return { ok: false }
  if (!STEPS.every((step) => isStepValid(step.id, choices, content))) return { ok: false }

  const input = buildCharacterChoicesInput(choices, content)
  if (!input) return { ok: false }
  const result = await validateCharacterChoices(input)
  if (result.__typename !== 'ValidCharacterResult') return { ok: false }

  return {
    ok: true,
    data: {
      name: choices.name,
      choices,
      summary: {
        typeName: type.name,
        descriptorName: descriptor.name,
        focusName: focus.name,
        tier: result.character.tier,
      },
      contentVersions: Object.fromEntries(
        [type.id, descriptor.id, focus.id].flatMap((key) => {
          const v = versions.get(key)
          return v ? [[key, v]] : []
        }),
      ),
    },
  }
}
