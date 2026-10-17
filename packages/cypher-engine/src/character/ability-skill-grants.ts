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

/**
 * One time a skill-granting ability was gained, and so one set of skills to
 * pick. Generic in the grant so Edge grants (`edge.ts`) reuse the same
 * collection and keys.
 */
export interface SkillGrantInstance<G = SkillGrant> {
  /** The `ability_skill_choices` key for this instance. */
  key: string
  ability_id: string
  kind: 'type' | 'focus'
  tier: number
  grant: G
}

/** Prefix of a skill the player typed (`custom:chess`) instead of picking from the catalog. */
export const CUSTOM_SKILL_PREFIX = 'custom:'
export const CUSTOM_SKILL_MAX_LENGTH = 60

export const isCustomSkill = (skillId: string) => skillId.startsWith(CUSTOM_SKILL_PREFIX)

/** The typed text of a custom skill id, with whitespace tidied. */
export function customSkillText(skillId: string): string {
  return skillId.slice(CUSTOM_SKILL_PREFIX.length).trim().replace(/\s+/g, ' ')
}

/** Identity of a skill for "already chosen / already trained": custom ones compare ignoring case. */
const canonical = (skillId: string) =>
  isCustomSkill(skillId) ? CUSTOM_SKILL_PREFIX + customSkillText(skillId).toLowerCase() : skillId

const ERRORS = {
  TOO_MANY: (abilityId: string, required: number) =>
    `Ability "${abilityId}" grants only ${required} skill(s), but more were supplied`,
  INVALID: (abilityId: string, skillId: string) =>
    `"${skillId}" is not one of the skills ability "${abilityId}" can train`,
  DUPLICATE: (skillId: string) =>
    `"${skillId}" is chosen for an ability but the character is already trained in it`,
  CHOSEN_AGAIN: (skillId: string) =>
    `"${skillId}" is chosen more than once for the same ability — a different one is needed each time`,
  MAXED: (skillId: string) =>
    `"${skillId}" can't be chosen: the character is already specialized in it`,
  NOT_TRAINED: (skillId: string) =>
    `"${skillId}" can't be chosen: this ability only applies to skills the character is already trained in`,
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
export function collectSkillGrantInstances<G = SkillGrant>(
  type: Pick<Type, 'special_ability_id'>,
  focus: Pick<Focus, 'tier_abilities'>,
  currentTier: number,
  choices: Pick<
    CharacterChoices,
    'tier_1_type_ability_ids' | 'type_ability_picks' | 'focus_choice_selections'
  >,
  grants: Record<string, G>,
): SkillGrantInstance<G>[] {
  const instances: SkillGrantInstance<G>[] = []
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

type SkillMap = Record<string, { level: SkillLevel }>

/**
 * Applies the player's skill picks for skill-granting abilities to a skill
 * map, one instance at a time and in tier order, so callers can interleave
 * them with the 'skills' advancement purchases. A purchase tagged tier N
 * leads *to* N, so it comes before the picks made on reaching N: call
 * `through(N - 1, …)` before applying a purchase tagged N, and `through(Infinity, …)`
 * once the purchases are done.
 *
 * What a pick does depends on the grant's `mode` (see `Ability.skill_grant`):
 * - 'train' (default): the skill must not be trained yet -> trained.
 * - 'train_or_specialize': not trained -> trained, trained -> specialized;
 *   an already specialized skill is refused.
 * - 'specialize': the skill must already be trained -> specialized.
 * Every pick must come from the ability's `options` unless that is
 * 'noncombat', in which case it must not be one of `combatSkillIds`. Neither
 * list is checked against the skill catalog — the engine has none; callers
 * with the catalog should. Within one ability (several times taken) and
 * within one pick, a skill can't be chosen twice: the text says "a different
 * type each time".
 *
 * Missing picks are never an error: they are reported through `pending`,
 * whatever the tier. Skill choices were added after characters already
 * existed, so one saved with, say, Physical Skills at tier 1 must still
 * derive (and be asked again) rather than turn invalid. Creation flows that
 * want the tier-1 picks complete check `pending_picks` themselves.
 *
 * Throws on a bad pick; the failing instance is consumed first, so a caller
 * that collects errors can keep going with the next one.
 */
export function createSkillGrantApplier(
  instances: SkillGrantInstance[],
  choices: Record<string, string[]>,
  pending: PendingPick[],
  combatSkillIds: ReadonlySet<string> = new Set(),
) {
  const known = new Set(instances.map((instance) => instance.key))
  for (const key of Object.keys(choices)) {
    if (!known.has(key)) {
      throw new CharacterRuleError('ABILITY_SKILL_CHOICE_UNKNOWN', ERRORS.UNKNOWN(key), { key })
    }
  }

  const ordered = [...instances]
  const chosenByAbility = new Map<string, Set<string>>()
  let next = 0

  function applyOne(instance: SkillGrantInstance, skills: SkillMap): SkillMap {
    const { key, ability_id, tier, grant } = instance
    const picked = choices[key] ?? []

    // An ability with an `alternate` shape ("two skills, or specialized in
    // one") takes either; which one the picks are is told by their number.
    const maxCount = Math.max(grant.count, grant.alternate?.count ?? 0)
    const mode =
      grant.alternate && picked.length === grant.alternate.count
        ? grant.alternate.mode
        : (grant.mode ?? 'train')
    const complete = picked.length === grant.count || picked.length === grant.alternate?.count

    if (picked.length > maxCount) {
      throw new CharacterRuleError(
        'ABILITY_SKILL_CHOICE_COUNT',
        ERRORS.TOO_MANY(ability_id, maxCount),
        { abilityId: ability_id, required: maxCount },
      )
    }
    if (!complete) {
      pending.push({
        kind: 'skill',
        tier,
        key,
        ability_id,
        required: grant.count,
        chosen: picked.length,
        ...(grant.alternate ? { alternate_required: grant.alternate.count } : {}),
      })
    }

    const usedByAbility = chosenByAbility.get(ability_id) ?? new Set<string>()
    chosenByAbility.set(ability_id, usedByAbility)

    // The skill's entry in the map, found ignoring case for custom ones.
    const entryKey = (map: SkillMap, skillId: string) =>
      Object.keys(map).find((k) => canonical(k) === canonical(skillId)) ?? skillId

    let result = skills
    for (const pickedId of picked) {
      const params = { abilityId: ability_id, skillId: pickedId }
      let skillId = pickedId
      if (isCustomSkill(pickedId)) {
        const text = customSkillText(pickedId)
        if (!grant.allow_custom || text.length === 0 || text.length > CUSTOM_SKILL_MAX_LENGTH) {
          throw new CharacterRuleError(
            'ABILITY_SKILL_CHOICE_INVALID',
            ERRORS.INVALID(ability_id, pickedId),
            params,
          )
        }
        skillId = CUSTOM_SKILL_PREFIX + text
      } else {
        const allowed =
          grant.options === 'noncombat'
            ? !combatSkillIds.has(skillId)
            : grant.options.includes(skillId)
        if (!allowed) {
          throw new CharacterRuleError(
            'ABILITY_SKILL_CHOICE_INVALID',
            ERRORS.INVALID(ability_id, skillId),
            params,
          )
        }
      }
      if (usedByAbility.has(canonical(skillId))) {
        throw new CharacterRuleError(
          'ABILITY_SKILL_CHOICE_DUPLICATE',
          ERRORS.CHOSEN_AGAIN(skillId),
          params,
        )
      }
      usedByAbility.add(canonical(skillId))

      const mapKey = entryKey(result, skillId)
      const level = result[mapKey]?.level
      if (mode === 'train') {
        if (level === 'trained' || level === 'specialized') {
          throw new CharacterRuleError(
            'ABILITY_SKILL_CHOICE_DUPLICATE',
            ERRORS.DUPLICATE(skillId),
            params,
          )
        }
        result = { ...result, [mapKey]: { level: 'trained' } }
      } else if (mode === 'train_or_specialize') {
        if (level === 'specialized') {
          throw new CharacterRuleError('ABILITY_SKILL_CHOICE_MAXED', ERRORS.MAXED(skillId), params)
        }
        result = {
          ...result,
          [mapKey]: { level: level === 'trained' ? 'specialized' : 'trained' },
        }
      } else {
        if (level === 'specialized') {
          throw new CharacterRuleError('ABILITY_SKILL_CHOICE_MAXED', ERRORS.MAXED(skillId), params)
        }
        if (level !== 'trained') {
          throw new CharacterRuleError(
            'ABILITY_SKILL_CHOICE_NOT_TRAINED',
            ERRORS.NOT_TRAINED(skillId),
            params,
          )
        }
        result = { ...result, [mapKey]: { level: 'specialized' } }
      }
    }
    return result
  }

  return {
    /** Applies every not-yet-applied instance gained at `tier` or below. */
    through(tier: number, skills: SkillMap): SkillMap {
      let result = skills
      while (next < ordered.length && ordered[next]!.tier <= tier) {
        const instance = ordered[next]!
        next += 1
        result = applyOne(instance, result)
      }
      return result
    },
  }
}

/** Applies every skill pick at once — for callers with no purchases to interleave. */
export function applyAbilitySkillGrants(
  instances: SkillGrantInstance[],
  choices: Record<string, string[]>,
  skills: SkillMap,
  pending: PendingPick[],
  combatSkillIds: ReadonlySet<string> = new Set(),
): SkillMap {
  return createSkillGrantApplier(instances, choices, pending, combatSkillIds).through(
    Infinity,
    skills,
  )
}
