import type { Descriptor, Focus, Type } from '@cypher/content'

import {
  collectSkillGrantInstances,
  createSkillGrantApplier,
  type SkillGrantsByAbility,
} from './character/ability-skill-grants.js'
import {
  collectAbilityChoiceInstances,
  resolveAbilityChoices,
  type AbilityChoicesByAbility,
} from './character/ability-choices.js'
import { deriveEdge, resolveStartingEdge } from './character/edge.js'
import { deriveEffort } from './character/effort.js'
import { resolveFlavor, type FlavorContent } from './character/flavor.js'
import { resolveFocusAbilities } from './character/focus-abilities.js'
import { derivePoolMax } from './character/pool.js'
import {
  applyAbilityTrainingPurchase,
  applyDescriptorSkills,
  applySkillAdvancementPurchase,
} from './character/skills.js'
import { deriveTier } from './character/tier.js'
import {
  resolveTypeAbilities,
  resolveTypeTierPicks,
  sortPending,
} from './character/type-abilities.js'
import type {
  CharacterChoices,
  DerivedCharacter,
  KnownAbility,
  PendingPick,
  SkillLevel,
} from './character/types.js'

export * from './character/types.js'

export interface CharacterContent {
  type: Type
  descriptor: Descriptor
  focus: Focus
  /** The flavor named by `choices.flavor_id`; required when that is set. */
  flavor?: FlavorContent | null
  /**
   * Skill grants of the abilities the character could have, by ability id
   * (build it from every Ability that has a `skill_grant`). Left out, no
   * ability is treated as granting skills — callers that save or validate
   * a character must supply it, or `ability_skill_choices` is rejected.
   */
  skill_grants?: SkillGrantsByAbility
  /**
   * Choice of the abilities that have one, by ability id (build it from every
   * Ability with a `choice`). Left out, no ability asks for picks and any
   * `ability_choices` is rejected.
   */
  ability_choices?: AbilityChoicesByAbility
  /** Ids of the skills flagged `combat`; a 'noncombat' grant can't pick them. */
  combat_skill_ids?: string[]
}

/**
 * Derives a character's full stat block from their choices. Pure and
 * deterministic — the caller is responsible for fetching `content` via
 * @cypher/content's loader; this function does no I/O. Meant to be called
 * both for live numbers during character creation and to recompute/validate
 * on the server whenever a character is saved — never trust a
 * client-submitted derived block.
 */
export function deriveCharacter(
  choices: CharacterChoices,
  content: CharacterContent,
): DerivedCharacter {
  const { type, descriptor, focus } = content

  const startingEdge = resolveStartingEdge(type, choices.starting_edge_choice)
  const tier = deriveTier(choices.advancement_purchases)
  const edge = deriveEdge(startingEdge, choices.advancement_purchases)
  const effort = deriveEffort(choices.advancement_purchases)
  const pools = derivePoolMax(
    type,
    choices.pool_point_allocation,
    choices.descriptor_pool_bonus,
    choices.advancement_purchases,
  )

  const pending: PendingPick[] = []
  const skillGrants = content.skill_grants ?? {}
  const repeatable = new Set(
    Object.entries(skillGrants)
      .filter(([, grant]) => grant.repeatable)
      .map(([id]) => id),
  )
  const flavor = resolveFlavor(choices.flavor_id, content.flavor)
  const tier1TypeAbilities = resolveTypeAbilities(type, choices.tier_1_type_ability_ids, flavor)
  let knownAbilities: KnownAbility[] = [
    ...tier1TypeAbilities,
    ...resolveTypeTierPicks(
      type,
      tier,
      choices.type_ability_picks ?? {},
      tier1TypeAbilities.map((a) => a.ability_id),
      pending,
      repeatable,
      flavor,
    ),
    ...resolveFocusAbilities(focus, tier, choices.focus_choice_selections, pending),
  ]
  // Abilities picked for choice abilities (Blessing of the Gods…) join the rest.
  knownAbilities = [
    ...knownAbilities,
    ...resolveAbilityChoices(
      collectAbilityChoiceInstances(tier, choices, content.ability_choices ?? {}),
      choices.ability_choices ?? {},
      knownAbilities,
      pending,
    ),
  ]

  let skills = applyDescriptorSkills(descriptor, choices.descriptor_skill_choices)
  const grantApplier = createSkillGrantApplier(
    collectSkillGrantInstances(type, focus, tier, choices, skillGrants),
    choices.ability_skill_choices ?? {},
    pending,
    new Set(content.combat_skill_ids ?? []),
  )
  // Picks made on reaching tier N come after the purchases tagged N.
  skills = grantApplier.through(1, skills)

  // 'skills' purchases are order-sensitive (training the same skill twice
  // moves it further along practiced -> trained -> specialized), so they're
  // applied in tier order regardless of how the caller supplied them.
  const skillsPurchases = choices.advancement_purchases
    .filter((purchase) => purchase.option === 'skills')
    .sort((a, b) => a.tier - b.tier)

  for (const purchase of skillsPurchases) {
    skills = grantApplier.through(purchase.tier - 1, skills)
    if (purchase.target.kind === 'skill') {
      const skillId = purchase.target.skill_id
      const level: SkillLevel = applySkillAdvancementPurchase(skills[skillId]?.level)
      skills = { ...skills, [skillId]: { level } }
    } else {
      knownAbilities = applyAbilityTrainingPurchase(knownAbilities, purchase)
    }
  }

  skills = grantApplier.through(Infinity, skills)

  return {
    tier,
    pools,
    edge,
    effort,
    known_abilities: knownAbilities,
    skills,
    pending_picks: sortPending(pending),
  }
}
