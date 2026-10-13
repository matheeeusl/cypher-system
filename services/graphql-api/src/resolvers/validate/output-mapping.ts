import type { DerivedCharacter, KnownAbility, ValidationResult } from '@cypher/engine'

function mapKnownAbility(ability: KnownAbility) {
  return {
    abilityId: ability.ability_id,
    source:
      ability.source.kind === 'type'
        ? { __typename: 'TypeAbilitySource' as const, typeId: ability.source.type_id }
        : { __typename: 'FocusAbilitySource' as const, focusId: ability.source.focus_id },
    trained: ability.trained,
  }
}

function mapDerivedCharacter(character: DerivedCharacter) {
  return {
    tier: character.tier,
    pools: {
      might: { max: character.pools.might.max },
      speed: { max: character.pools.speed.max },
      intellect: { max: character.pools.intellect.max },
    },
    edge: character.edge,
    effort: character.effort,
    knownAbilities: character.known_abilities.map(mapKnownAbility),
    skills: Object.entries(character.skills).map(([skillId, { level }]) => ({ skillId, level })),
    pendingPicks: character.pending_picks.map((pick) =>
      pick.kind === 'skill'
        ? { ...pick, abilityId: pick.ability_id }
        : { ...pick, key: null, abilityId: null },
    ),
  }
}

// __typename is set explicitly on both branches (and on each KnownAbility's
// source above) so Yoga's default union resolveType — which checks
// __typename first — handles ValidationResultPayload, and AbilitySource,
// with no custom resolveType functions needed anywhere in this service.
export function mapValidationResult(result: ValidationResult) {
  if (result.valid) {
    return {
      __typename: 'ValidCharacterResult' as const,
      character: mapDerivedCharacter(result.character),
    }
  }
  return {
    __typename: 'InvalidCharacterResult' as const,
    errors: result.errors,
    issues: result.issues.map(({ code, params }) => ({
      code,
      params: Object.entries(params).map(([key, value]) => ({ key, value: String(value) })),
    })),
  }
}
