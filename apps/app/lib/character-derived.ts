import { buildCharacterChoicesInput } from '@/components/wizard/derive'
import type { SavedCharacter } from '@/lib/characters'
import {
  fetchAbilities,
  fetchDescriptors,
  fetchFoci,
  fetchSkills,
  fetchTypes,
  validateCharacterChoices,
  type DerivedCharacter,
  type WizardAbility,
  type WizardDescriptor,
  type WizardFocus,
  type WizardSkill,
  type WizardType,
} from '@/lib/graphql/queries'

export interface DerivedBundle {
  type: WizardType
  descriptor: WizardDescriptor
  focus: WizardFocus
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
  const [types, descriptors, foci, skills, abilities] = await Promise.all([
    fetchTypes(),
    fetchDescriptors(),
    fetchFoci(),
    fetchSkills(),
    fetchAbilities(),
  ])

  const { choices } = character
  const type = types.find((t) => t.id === choices.typeId)
  const descriptor = descriptors.find((d) => d.id === choices.descriptorId)
  const focus = foci.find((f) => f.id === choices.focusId)
  if (!type || !descriptor || !focus) return null

  const input = buildCharacterChoicesInput(
    choices,
    { type, descriptor, focus },
    character.advancement,
    character.tierPicks,
  )
  if (!input) return null
  const result = await validateCharacterChoices(input)
  if (result.__typename !== 'ValidCharacterResult') return null

  return { type, descriptor, focus, derived: result.character, skills, abilities }
}
