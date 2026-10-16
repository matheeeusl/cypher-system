import { buildCharacterChoicesInput } from '@/components/wizard/derive'
import type { SavedCharacter } from '@/lib/characters'
import { flavorIdInUse } from '@/lib/tier-picks'
import {
  fetchAbilities,
  fetchDescriptors,
  fetchFlavors,
  fetchFoci,
  fetchSkills,
  fetchTypes,
  validateCharacterChoices,
  type DerivedCharacter,
  type WizardAbility,
  type WizardDescriptor,
  type WizardFlavor,
  type WizardFocus,
  type WizardSkill,
  type WizardType,
} from '@/lib/graphql/queries'

export interface DerivedBundle {
  type: WizardType
  descriptor: WizardDescriptor
  focus: WizardFocus
  /** The chosen flavor, or null when the character has none. */
  flavor: WizardFlavor | null
  derived: DerivedCharacter
  skills: WizardSkill[]
  abilities: WizardAbility[]
}

/**
 * Re-derives a saved character (its wizard choices plus every advancement
 * purchase) through graphql-api. Returns null when those no longer make a
 * valid character under the current rules. Throws if the API is unreachable.
 * Shared by the read-only sheet and play mode.
 */
export async function loadDerived(character: SavedCharacter): Promise<DerivedBundle | null> {
  const [types, descriptors, foci, flavors, skills, abilities] = await Promise.all([
    fetchTypes(),
    fetchDescriptors(),
    fetchFoci(),
    fetchFlavors(),
    fetchSkills(),
    fetchAbilities(),
  ])

  const { choices } = character
  const type = types.find((t) => t.id === choices.typeId)
  const descriptor = descriptors.find((d) => d.id === choices.descriptorId)
  const focus = foci.find((f) => f.id === choices.focusId)
  const flavorId = flavorIdInUse(choices, character.tierPicks)
  const flavor = flavorId ? (flavors.find((f) => f.id === flavorId) ?? null) : null
  if (!type || !descriptor || !focus) return null
  // A flavor that no longer exists makes the build invalid, like a removed Focus.
  if (flavorId && !flavor) return null

  const input = buildCharacterChoicesInput(
    choices,
    { type, descriptor, focus, flavor: flavor ?? undefined, abilities },
    character.advancement,
    character.tierPicks,
  )
  if (!input) return null
  const result = await validateCharacterChoices(input)
  if (result.__typename !== 'ValidCharacterResult') return null

  return { type, descriptor, focus, flavor, derived: result.character, skills, abilities }
}
