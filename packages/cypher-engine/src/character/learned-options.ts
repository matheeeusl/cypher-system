import type { AbilityChoicesByAbility } from './ability-choices.js'
import type { FlavorContent } from './flavor.js'
import type { KnownAbility } from './types.js'
import { CharacterRuleError } from '../errors.js'

const ERRORS = {
  NOT_AVAILABLE: (abilityId: string) =>
    `"${abilityId}" can't be learned: it has no learn rule, or the character's flavor doesn't offer it`,
  COUNT: (abilityId: string, per: number) =>
    `Options of "${abilityId}" are learned ${per} at a time, but a different number were supplied`,
  INVALID: (abilityId: string, optionId: string) =>
    `"${optionId}" is not one of the abilities "${abilityId}" offers`,
  DUPLICATE: (optionId: string) =>
    `"${optionId}" is learned more than once, or the character already has it`,
}

/**
 * Turns options learned later for XP into known abilities (Cantrips: "spend 2 XP
 * to learn two cantrips"). `learned` maps a choice ability to the options bought
 * for it, in multiples of its `learn.count`. Only a character whose flavor lists
 * that ability may learn from it. The engine doesn't track XP: the caller charges
 * `learn.xp_cost` per purchase. Throws on an ability that can't be learned, a
 * count that isn't a whole number of purchases, an option the ability doesn't
 * offer, or a repeat/already-known ability.
 *
 * `known` must already hold everything the character has (including the options
 * picked when the choice ability was taken). The learned abilities are credited
 * to the flavor, like any other flavor ability.
 */
export function resolveLearnedOptions(
  flavor: FlavorContent | null,
  defs: AbilityChoicesByAbility,
  learned: Record<string, string[]>,
  known: KnownAbility[],
): KnownAbility[] {
  const have = new Set(known.map((k) => k.ability_id))
  const result: KnownAbility[] = []
  for (const [abilityId, optionIds] of Object.entries(learned)) {
    const def = defs[abilityId]
    const offered = flavor && Object.values(flavor.tier_abilities).flat().includes(abilityId)
    if (!def?.learn || !flavor || !offered) {
      throw new CharacterRuleError('LEARN_NOT_AVAILABLE', ERRORS.NOT_AVAILABLE(abilityId), {
        abilityId,
      })
    }
    if (optionIds.length % def.learn.count !== 0) {
      throw new CharacterRuleError('LEARN_COUNT', ERRORS.COUNT(abilityId, def.learn.count), {
        abilityId,
        per: def.learn.count,
      })
    }
    for (const optionId of optionIds) {
      if (!def.options.includes(optionId)) {
        throw new CharacterRuleError('LEARN_INVALID', ERRORS.INVALID(abilityId, optionId), {
          abilityId,
          optionId,
        })
      }
      if (have.has(optionId)) {
        throw new CharacterRuleError('LEARN_DUPLICATE', ERRORS.DUPLICATE(optionId), {
          abilityId,
          optionId,
        })
      }
      have.add(optionId)
      result.push({
        ability_id: optionId,
        source: { kind: 'flavor', flavor_id: flavor.id },
        trained: false,
      })
    }
  }
  return result
}
