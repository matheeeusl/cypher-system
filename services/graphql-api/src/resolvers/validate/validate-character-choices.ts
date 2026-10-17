import {
  getAllAbilities,
  getAllSkills,
  getDescriptorById,
  getFlavorById,
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
  // The flavor in use: the one chosen at creation, or else the one gained in play.
  // Both together is a rule violation the engine reports, so content is loaded for
  // the creation flavor first.
  const flavorId = input.flavorId ?? input.flavorGain?.flavorId ?? null
  const flavor = flavorId !== null ? getFlavorById(flavorId) : null
  if (flavorId !== null && !flavor) throw new GraphQLError(`No Flavor found for id "${flavorId}"`)

  // Skill ids are an unvalidated string in the engine ('any' grants have no
  // list to check against), so a stale or invented one is rejected here, as
  // with the Type/Descriptor/Focus ids above.
  for (const { skillIds } of input.abilitySkillChoices ?? []) {
    for (const skillId of skillIds) {
      // A typed skill ("custom:<text>") is the player's own; the engine
      // checks it is allowed and not empty.
      if (!skillId.startsWith('custom:') && !getSkillById(skillId))
        throw new GraphQLError(`No Skill found for id "${skillId}"`)
    }
  }

  return {
    type,
    descriptor,
    focus,
    flavor: flavor ?? null,
    skill_grants: skillGrantsByAbility(),
    ability_choices: abilityChoicesByAbility(),
    edge_grants: edgeGrantsByAbility(),
    combat_skill_ids: getAllSkills()
      .filter((skill) => skill.combat)
      .map((skill) => skill.id),
  }
}

function skillGrantsByAbility(): NonNullable<CharacterContent['skill_grants']> {
  const grants: NonNullable<CharacterContent['skill_grants']> = {}
  for (const ability of getAllAbilities()) {
    if (ability.skill_grant) grants[ability.id] = ability.skill_grant
  }
  return grants
}

function abilityChoicesByAbility(): NonNullable<CharacterContent['ability_choices']> {
  const choices: NonNullable<CharacterContent['ability_choices']> = {}
  for (const ability of getAllAbilities()) {
    if (ability.choice) choices[ability.id] = ability.choice
  }
  return choices
}

function edgeGrantsByAbility(): NonNullable<CharacterContent['edge_grants']> {
  const grants: NonNullable<CharacterContent['edge_grants']> = {}
  for (const ability of getAllAbilities()) {
    if (ability.edge_grant) grants[ability.id] = ability.edge_grant
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
