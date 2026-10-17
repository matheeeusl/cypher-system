import type { DerivedCharacter, KnownAbility, ValidationResult } from '@cypher/engine'

function mapAbilitySource(source: KnownAbility['source']) {
  switch (source.kind) {
    case 'type':
      return { __typename: 'TypeAbilitySource' as const, typeId: source.type_id }
    case 'focus':
      return { __typename: 'FocusAbilitySource' as const, focusId: source.focus_id }
    case 'flavor':
      return { __typename: 'FlavorAbilitySource' as const, flavorId: source.flavor_id }
  }
}

function mapKnownAbility(ability: KnownAbility) {
  return {
    abilityId: ability.ability_id,
    source: mapAbilitySource(ability.source),
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
        ? {
            ...pick,
            abilityId: pick.ability_id,
            alternateRequired: pick.alternate_required ?? null,
          }
        : pick.kind === 'option'
          ? { ...pick, abilityId: pick.ability_id, alternateRequired: null }
          : pick.kind === 'edge'
            ? // One Edge to pick, so it reads like a one-pick choice.
              {
                ...pick,
                required: 1,
                chosen: 0,
                abilityId: pick.ability_id,
                alternateRequired: null,
              }
            : { ...pick, key: null, abilityId: null, alternateRequired: null },
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
