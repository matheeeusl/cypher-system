import type { Ability, Focus, Type } from '@cypher/content'

import type { CharacterChoices, PendingPick, SkillLevel } from './types.js'
import { CharacterRuleError } from '../errors.js'

export type SkillGrant = NonNullable<Ability['skill_grant']>

/**
 * ability id -> its skill_grant, for just the abilities that have one. The
 * engine does no content I/O, so the caller builds this from the Ability
 * catalog (see `CharacterContent.skill_grants`).
 */
export type SkillGrantsByAbility = Record<string, SkillGrant>

/** One time a skill-granting ability was gained, and so one set of skills to pick. */
export interface SkillGrantInstance {
  /** The `ability_skill_choices` key for this instance. */
  key: string
  ability_id: string
  kind: 'type' | 'focus'
  tier: number
  grant: SkillGrant
}

const ERRORS = {
  TOO_MANY: (abilityId: string, required: number) =>
    `Ability "${abilityId}" grants only ${required} skill(s), but more were supplied`,
  INVALID: (abilityId: string, skillId: string) =>
    `"${skillId}" is not one of the skills ability "${abilityId}" can train`,
  DUPLICATE: (skillId: string) =>
    `"${skillId}" is chosen for an ability but the character is already trained in it`,
  UNKNOWN: (key: string) =>
    `ability_skill_choices has an entry "${key}" that matches no skill-granting ability the character has`,
}

/** The `ability_skill_choices` key for an ability gained from a Type or Focus at a tier. */
export function skillGrantKey(kind: 'type' | 'focus', tier: number, abilityId: string): string {
  return `${kind}:${tier}:${abilityId}`
}

/**
 * Lists every skill-granting ability the character has, once per time it was
 * gained (an ability can be taken again at a later tier, and a Focus can
 * grant the same one at several tiers). Only call this once the Type and
 * Focus ability resolution has succeeded — it reads the same inputs those
 * validated, and doesn't re-validate them.
 */
export function collectSkillGrantInstances(
  type: Pick<Type, 'special_ability_id'>,
  focus: Pick<Focus, 'tier_abilities'>,
  currentTier: number,
  choices: Pick<
    CharacterChoices,
    'tier_1_type_ability_ids' | 'type_ability_picks' | 'focus_choice_selections'
  >,
  grants: SkillGrantsByAbility,
): SkillGrantInstance[] {
  const instances: SkillGrantInstance[] = []
  const add = (kind: 'type' | 'focus', tier: number, ids: Iterable<string>) => {
    for (const ability_id of new Set(ids)) {
      const grant = grants[ability_id]
      if (grant) {
        instances.push({
          key: skillGrantKey(kind, tier, ability_id),
          ability_id,
          kind,
          tier,
          grant,
        })
      }
    }
  }

  add('type', 1, [
    ...choices.tier_1_type_ability_ids,
    ...(type.special_ability_id !== null ? [type.special_ability_id] : []),
  ])
  for (const [tierKey, ids] of Object.entries(choices.type_ability_picks ?? {})) {
    if (Number(tierKey) <= currentTier) add('type', Number(tierKey), ids)
  }

  for (const [tierKey, entries] of Object.entries(focus.tier_abilities)) {
    if (Number(tierKey) > currentTier) continue
    add(
      'focus',
      Number(tierKey),
      entries.flatMap((entry) =>
        entry.kind === 'granted'
          ? [entry.ability_id]
          : (choices.focus_choice_selections[tierKey] ?? []),
      ),
    )
  }

  return instances.sort(
    (a, b) => a.tier - b.tier || (a.kind === b.kind ? 0 : a.kind === 'type' ? -1 : 1),
  )
}

/**
 * Applies the player's skill picks for every skill-granting ability to the
 * skill map, in tier order. Per the rulebook each pick must be a skill the
 * character is not already trained in (so two picks of the same ability, or
 * an ability and the Descriptor, can't overlap), and must come from the
 * ability's `options` unless that is 'noncombat', in which case it must not be
 * one of `combatSkillIds`. Neither is checked against the skill catalog —
 * the engine has none; callers with the catalog should.
 *
 * Missing picks are never an error here: they are reported through
 * `pending`, whatever the tier. Skill choices were added after characters
 * already existed, so one saved with, say, Physical Skills at tier 1 must
 * still derive (and be asked again) rather than turn invalid. Creation flows
 * that want the tier-1 picks complete check `pending_picks` themselves.
 *
 * Applied before all the 'skills' advancement purchases, whatever their
 * tier. Strictly, a purchase tagged tier N comes before the picks made on
 * reaching N, so this accepts one sequence the rulebook wouldn't (a
 * purchase trains X, then a later pick of X) — the resulting skill map is
 * the same either way, so the leniency isn't worth interleaving for.
 */
export function applyAbilitySkillGrants(
  instances: SkillGrantInstance[],
  choices: Record<string, string[]>,
  skills: Record<string, { level: SkillLevel }>,
  pending: PendingPick[],
  combatSkillIds: ReadonlySet<string> = new Set(),
): Record<string, { level: SkillLevel }> {
  const known = new Set(instances.map((instance) => instance.key))
  for (const key of Object.keys(choices)) {
    if (!known.has(key)) {
      throw new CharacterRuleError('ABILITY_SKILL_CHOICE_UNKNOWN', ERRORS.UNKNOWN(key), { key })
    }
  }

  let result = skills
  for (const { key, ability_id, tier, grant } of instances) {
    const picked = choices[key] ?? []

    if (picked.length > grant.count) {
      throw new CharacterRuleError(
        'ABILITY_SKILL_CHOICE_COUNT',
        ERRORS.TOO_MANY(ability_id, grant.count),
        { abilityId: ability_id, required: grant.count },
      )
    }
    if (picked.length < grant.count) {
      pending.push({
        kind: 'skill',
        tier,
        key,
        ability_id,
        required: grant.count,
        chosen: picked.length,
      })
    }

    for (const skillId of picked) {
      const allowed =
        grant.options === 'noncombat'
          ? !combatSkillIds.has(skillId)
          : grant.options.includes(skillId)
      if (!allowed) {
        throw new CharacterRuleError(
          'ABILITY_SKILL_CHOICE_INVALID',
          ERRORS.INVALID(ability_id, skillId),
          { abilityId: ability_id, skillId },
        )
      }
      const level = result[skillId]?.level
      if (level === 'trained' || level === 'specialized') {
        throw new CharacterRuleError('ABILITY_SKILL_CHOICE_DUPLICATE', ERRORS.DUPLICATE(skillId), {
          abilityId: ability_id,
          skillId,
        })
      }
      result = { ...result, [skillId]: { level: 'trained' } }
    }
  }

  return result
}
