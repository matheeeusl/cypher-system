import {
  getAllAbilities,
  getDescriptorById,
  getFocusById,
  getSkillById,
  getTypeById,
} from '@cypher/content'
import type { CharacterContent } from '@cypher/engine'
import { validateCharacterChoices } from '@cypher/engine'
import { GraphQLError } from 'graphql'

import type { CharacterChoicesInput } from './input-mapping.js'
import { mapCharacterChoicesInput } from './input-mapping.js'
import { mapValidationResult } from './output-mapping.js'

// A CharacterChoicesInput carries raw ids, but validateCharacterChoices
// itself takes already-resolved Type/Descriptor/Focus objects — this is the
// one place responsible for that lookup. An unresolvable id is a different
// failure mode than a well-formed-but-invalid build (the client sent a
// nonsensical/stale id, not a build with bad math), so it surfaces as a
// top-level GraphQL error rather than an InvalidCharacterResult.
function resolveContentOrThrow(input: CharacterChoicesInput): CharacterContent {
  const type = getTypeById(input.typeId)
  const descriptor = getDescriptorById(input.descriptorId)
  const focus = getFocusById(input.focusId)

  if (!type) throw new GraphQLError(`No Type found for id "${input.typeId}"`)
  if (!descriptor) throw new GraphQLError(`No Descriptor found for id "${input.descriptorId}"`)
  if (!focus) throw new GraphQLError(`No Focus found for id "${input.focusId}"`)

  // Skill ids are an unvalidated string in the engine ('any' grants have no
  // list to check against), so a stale or invented one is rejected here, as
  // with the Type/Descriptor/Focus ids above.
  for (const { skillIds } of input.abilitySkillChoices ?? []) {
    for (const skillId of skillIds) {
      if (!getSkillById(skillId)) throw new GraphQLError(`No Skill found for id "${skillId}"`)
    }
  }

  return { type, descriptor, focus, skill_grants: skillGrantsByAbility() }
}

function skillGrantsByAbility(): NonNullable<CharacterContent['skill_grants']> {
  const grants: NonNullable<CharacterContent['skill_grants']> = {}
  for (const ability of getAllAbilities()) {
    if (ability.skill_grant) grants[ability.id] = ability.skill_grant
  }
  return grants
}

export const validateResolvers = {
  Query: {
    validateCharacterChoices: (_parent: unknown, args: { input: CharacterChoicesInput }) => {
      const content = resolveContentOrThrow(args.input)
      const choices = mapCharacterChoicesInput(args.input)
      return mapValidationResult(validateCharacterChoices(choices, content))
    },
  },
}
