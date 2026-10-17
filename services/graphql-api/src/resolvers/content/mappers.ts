import type {
  Ability,
  Artifact,
  Cypher,
  Descriptor,
  Flavor,
  Focus,
  Oddity,
  Skill,
  Type,
  WithVersion,
} from '@cypher/content'
import { getDescriptorCategoryTable } from '@cypher/content'
import { getCypherLimit } from '@cypher/engine'

type LocalizedStringValue = { en: string; 'pt-BR': string }

// 'pt-BR' isn't a legal GraphQL field name (hyphen) — every content entity's
// localized-text fields go through this rename.
export function mapLocalizedString(value: LocalizedStringValue) {
  return { en: value.en, ptBR: value['pt-BR'] }
}

// Type.tier_abilities / Focus.tier_abilities are zod z.record maps keyed by
// tier (as a string, e.g. '1') — GraphQL has no map type, so both become a
// tier-ordered list. The two entities' per-tier value shape differs
// (Type: plain ability-id strings; Focus: granted/choice union), so this
// only factors out the "record -> sorted {tier, items} list" part; each
// caller still maps `items` into its own GraphQL shape.
function tierEntries<T>(record: Record<string, T[]>): Array<{ tier: number; items: T[] }> {
  return Object.entries(record)
    .map(([tier, items]) => ({ tier: Number(tier), items }))
    .sort((a, b) => a.tier - b.tier)
}

export function mapTypeTierAbilities(record: Type['tier_abilities']) {
  return tierEntries(record).map(({ tier, items }) => ({ tier, abilityIds: items }))
}

export function mapFocusTierAbilities(record: Focus['tier_abilities']) {
  return tierEntries(record).map(({ tier, items }) => ({
    tier,
    entries: items.map((entry) =>
      entry.kind === 'granted'
        ? { __typename: 'GrantedAbility' as const, abilityId: entry.ability_id }
        : {
            __typename: 'ChoiceAbility' as const,
            // Normalize each option to a list: a plain ability_id string
            // becomes a 1-element list, an already-bundled pair stays as
            // its (2+-element) list — see schema.graphql's ChoiceAbility.
            options: entry.options.map((option) => (Array.isArray(option) ? option : [option])),
            count: entry.count,
          },
    ),
  }))
}

export function mapType(t: WithVersion<Type>) {
  return {
    id: t.id,
    name: mapLocalizedString(t.name),
    tagline: mapLocalizedString(t.tagline),
    description: {
      individualRole: mapLocalizedString(t.description.individual_role),
      groupRole: mapLocalizedString(t.description.group_role),
      societalRole: mapLocalizedString(t.description.societal_role),
    },
    playerIntrusions: t.player_intrusions.map((intrusion) => ({
      name: mapLocalizedString(intrusion.name),
      description: mapLocalizedString(intrusion.description),
    })),
    startingPools: t.starting_pools,
    startingEdge: { statChoices: t.starting_edge.stat_choices, amount: t.starting_edge.amount },
    specialAbilityId: t.special_ability_id,
    cypherLimit: getCypherLimit(t),
    weaponProficiency: {
      practiced: t.weapon_proficiency.practiced,
      inability: t.weapon_proficiency.inability,
    },
    startingSkills: t.starting_skills,
    startingEquipment: {
      clothing: t.starting_equipment.clothing,
      weapon: t.starting_equipment.weapon ? mapLocalizedString(t.starting_equipment.weapon) : null,
      items: t.starting_equipment.items.map((item) => ({
        priceTier: item.price_tier,
        count: item.count,
        exact: item.exact,
      })),
    },
    tierAbilities: mapTypeTierAbilities(t.tier_abilities),
    tierChooseCounts: Object.entries(t.tier_choose_counts)
      .map(([tier, count]) => ({ tier: Number(tier), count }))
      .sort((a, b) => a.tier - b.tier),
    contentVersion: t.content_version,
  }
}

function mapDescriptorCategory(id: Descriptor['category']) {
  // The content tests guarantee every category id has a row.
  const row = getDescriptorCategoryTable().find((c) => c.id === id)
  if (!row) throw new Error(`Unknown descriptor category "${id}"`)
  return {
    id: row.id,
    name: mapLocalizedString(row.name),
    intro: row.intro ? mapLocalizedString(row.intro) : null,
    page: row.page,
  }
}

function mapPoolBonusChoice(choice: Descriptor['pool_bonus_choice']) {
  if (!choice) return null
  if (choice.kind === 'divide') {
    return {
      __typename: 'DescriptorPoolDivide' as const,
      points: choice.points,
      stats: choice.stats,
    }
  }
  return {
    __typename: 'DescriptorPoolOneOf' as const,
    options: choice.options.map((option) =>
      option.map((b) => ({ stat: b.stat, amount: b.amount })),
    ),
  }
}

export function mapDescriptor(d: WithVersion<Descriptor>) {
  return {
    id: d.id,
    name: mapLocalizedString(d.name),
    description: mapLocalizedString(d.description),
    category: mapDescriptorCategory(d.category),
    poolBonus: d.pool_bonus.map((b) => ({ stat: b.stat, amount: b.amount })),
    poolBonusChoice: mapPoolBonusChoice(d.pool_bonus_choice),
    characteristics: d.characteristics.map((c) => ({
      name: mapLocalizedString(c.name),
      description: mapLocalizedString(c.description),
    })),
    skillTraining: d.skill_training.map((s) => ({
      skillId: s.skill_id,
      choiceCount: s.choice_count,
      note: s.note ? mapLocalizedString(s.note) : null,
    })),
    inabilities: d.inabilities.map(mapLocalizedString),
    additionalEquipment: d.additional_equipment ? mapLocalizedString(d.additional_equipment) : null,
    connectionOptions: d.connection_options.map(mapLocalizedString),
    contentVersion: d.content_version,
  }
}

export function mapFocus(f: WithVersion<Focus>) {
  return {
    id: f.id,
    name: mapLocalizedString(f.name),
    description: mapLocalizedString(f.description),
    tierAbilities: mapFocusTierAbilities(f.tier_abilities),
    typeSwapOption: f.type_swap_option ? { abilityIds: f.type_swap_option.ability_ids } : null,
    contentVersion: f.content_version,
  }
}

export function mapFlavor(f: WithVersion<Flavor>) {
  return {
    id: f.id,
    name: mapLocalizedString(f.name),
    description: mapLocalizedString(f.description),
    tierAbilities: mapTypeTierAbilities(f.tier_abilities),
    contentVersion: f.content_version,
  }
}

export function mapAbility(a: WithVersion<Ability>) {
  return {
    id: a.id,
    name: mapLocalizedString(a.name),
    description: mapLocalizedString(a.description),
    cost: a.cost ? { pool: a.cost.pool, amount: a.cost.amount } : null,
    actionType: a.action_type,
    sources: a.sources.map((s) => ({
      type: s.type,
      id: s.id,
      tier: s.tier,
      cyberware: s.cyberware ?? false,
    })),
    attack: a.attack ?? false,
    skillGrant: a.skill_grant
      ? {
          count: a.skill_grant.count,
          mode: a.skill_grant.mode ?? 'train',
          alternate: a.skill_grant.alternate ?? null,
          allowCustom: a.skill_grant.allow_custom ?? false,
          noncombat: a.skill_grant.options === 'noncombat',
          options: a.skill_grant.options === 'noncombat' ? [] : a.skill_grant.options,
        }
      : null,
    choice: a.choice
      ? {
          options: a.choice.options,
          count: a.choice.count,
          learn: a.choice.learn
            ? { xpCost: a.choice.learn.xp_cost, count: a.choice.learn.count }
            : null,
        }
      : null,
    edgeGrant: a.edge_grant
      ? a.edge_grant.kind === 'fixed'
        ? { kind: 'fixed', stat: a.edge_grant.stat, amount: a.edge_grant.amount }
        : { kind: 'choose_zero', stat: null, amount: null }
      : null,
    contentVersion: a.content_version,
  }
}

export function mapSkill(s: WithVersion<Skill>) {
  return {
    id: s.id,
    name: mapLocalizedString(s.name),
    description: mapLocalizedString(s.description),
    combat: s.combat ?? false,
    contentVersion: s.content_version,
  }
}

export function mapCypher(c: WithVersion<Cypher>) {
  return {
    id: c.id,
    name: mapLocalizedString(c.name),
    category: c.category,
    pageRef: c.page_ref,
    levelRange: c.level_range,
    effectText: mapLocalizedString(c.effect_text),
    effectTable: c.effect_table
      ? {
          label: mapLocalizedString(c.effect_table.label),
          entries: c.effect_table.entries.map((entry) => ({
            range: entry.range,
            text: mapLocalizedString(entry.text),
          })),
        }
      : null,
    contentVersion: c.content_version,
  }
}

export function mapArtifact(a: WithVersion<Artifact>) {
  return {
    id: a.id,
    name: mapLocalizedString(a.name),
    level: a.level,
    form: mapLocalizedString(a.form),
    effectText: mapLocalizedString(a.effect_text),
    effectTable: a.effect_table
      ? {
          label: mapLocalizedString(a.effect_table.label),
          entries: a.effect_table.entries.map((entry) => ({
            range: entry.range,
            text: mapLocalizedString(entry.text),
          })),
        }
      : null,
    flavorQuote: a.flavor_quote ? mapLocalizedString(a.flavor_quote) : null,
    depletionDie: a.depletion_die,
    contentVersion: a.content_version,
  }
}

export function mapOddity(o: WithVersion<Oddity>) {
  return {
    id: o.id,
    description: mapLocalizedString(o.description),
    contentVersion: o.content_version,
  }
}
