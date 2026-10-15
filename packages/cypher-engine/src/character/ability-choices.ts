import type { Ability } from '@cypher/content'

import type { CharacterChoices, KnownAbility, PendingPick } from './types.js'
import { CharacterRuleError } from '../errors.js'

export type AbilityChoiceDef = NonNullable<Ability['choice']>

/**
 * ability id -> its `choice`, for just the abilities that have one. The engine
 * does no content I/O, so the caller builds this from the Ability catalog (see
 * `CharacterContent.ability_choices`).
 */
export type AbilityChoicesByAbility = Record<string, AbilityChoiceDef>

/** One time a choice ability was picked, and so one set of options to pick. */
export interface AbilityChoiceInstance {
  /** The `ability_choices` key for this instance. */
  key: string
  ability_id: string
  tier: number
  def: AbilityChoiceDef
}

/**
 * The `ability_choices` key for a choice ability picked among the Type abilities
 * at a tier. Same format as a Type skill-grant key (`skillGrantKey('type', …)`):
 * the pick lives in the Type's lists even when the ability comes from a flavor.
 */
export function abilityChoiceKey(tier: number, abilityId: string): string {
  return `type:${tier}:${abilityId}`
}

const ERRORS = {
  UNKNOWN: (key: string) =>
    `ability_choices has an entry "${key}" that matches no choice ability the character has`,
  TOO_MANY: (abilityId: string, required: number) =>
    `Ability "${abilityId}" asks for ${required} choice(s), but more were supplied`,
  INVALID: (abilityId: string, optionId: string) =>
    `"${optionId}" is not one of the abilities "${abilityId}" offers`,
  DUPLICATE: (optionId: string) =>
    `"${optionId}" is chosen more than once, or the character already has it`,
}

/**
 * Lists every choice ability among the character's picks, once per time it was
 * taken. Only Type picks are looked at (tier 1 and `type_ability_picks`):
 * those are where a flavor's abilities end up. Call it once the Type ability
 * resolution has succeeded; it doesn't re-validate those picks.
 */
export function collectAbilityChoiceInstances(
  currentTier: number,
  choices: Pick<CharacterChoices, 'tier_1_type_ability_ids' | 'type_ability_picks'>,
  defs: AbilityChoicesByAbility,
): AbilityChoiceInstance[] {
  const instances: AbilityChoiceInstance[] = []
  const add = (tier: number, ids: Iterable<string>) => {
    for (const ability_id of new Set(ids)) {
      const def = defs[ability_id]
      if (def) instances.push({ key: abilityChoiceKey(tier, ability_id), ability_id, tier, def })
    }
  }
  add(1, choices.tier_1_type_ability_ids)
  for (const [tierKey, ids] of Object.entries(choices.type_ability_picks ?? {})) {
    if (Number(tierKey) <= currentTier) add(Number(tierKey), ids)
  }
  return instances.sort((a, b) => a.tier - b.tier)
}

/**
 * Turns the player's picks into known abilities. A picked ability counts as
 * coming from wherever its choice ability came from (`known` has that source).
 * A shortfall is never an error: it goes to `pending`, the player's outstanding
 * choices, whatever the tier. Too many picks, an option the ability doesn't
 * offer, a repeat, or an ability the character already has throws.
 */
export function resolveAbilityChoices(
  instances: AbilityChoiceInstance[],
  picks: Record<string, string[]>,
  known: KnownAbility[],
  pending: PendingPick[],
): KnownAbility[] {
  const keys = new Set(instances.map((instance) => instance.key))
  for (const key of Object.keys(picks)) {
    if (!keys.has(key)) {
      throw new CharacterRuleError('ABILITY_CHOICE_UNKNOWN', ERRORS.UNKNOWN(key), { key })
    }
  }

  const have = new Set(known.map((k) => k.ability_id))
  const result: KnownAbility[] = []
  for (const { key, ability_id, tier, def } of instances) {
    const picked = picks[key] ?? []
    const params = { abilityId: ability_id }
    if (picked.length > def.count) {
      throw new CharacterRuleError('ABILITY_CHOICE_COUNT', ERRORS.TOO_MANY(ability_id, def.count), {
        ...params,
        required: def.count,
      })
    }
    const source = known.find((k) => k.ability_id === ability_id)?.source
    for (const optionId of picked) {
      if (!def.options.includes(optionId)) {
        throw new CharacterRuleError(
          'ABILITY_CHOICE_INVALID',
          ERRORS.INVALID(ability_id, optionId),
          {
            ...params,
            optionId,
          },
        )
      }
      if (have.has(optionId)) {
        throw new CharacterRuleError('ABILITY_CHOICE_DUPLICATE', ERRORS.DUPLICATE(optionId), {
          ...params,
          optionId,
        })
      }
      have.add(optionId)
      if (source) result.push({ ability_id: optionId, source, trained: false })
    }
    if (picked.length < def.count) {
      pending.push({
        kind: 'option',
        tier,
        key,
        ability_id,
        required: def.count,
        chosen: picked.length,
      })
    }
  }
  return result
}
