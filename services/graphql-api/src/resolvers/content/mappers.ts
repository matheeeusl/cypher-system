import type {
  Ability,
  Artifact,
  Cypher,
  Descriptor,
  EquipmentItem,
  Focus,
  Oddity,
  Skill,
  Type,
  WithVersion,
} from '@cypher/content'

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
        : { __typename: 'ChoiceAbility' as const, options: entry.options },
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
    weaponProficiency: {
      practiced: t.weapon_proficiency.practiced,
      inability: t.weapon_proficiency.inability,
    },
    startingSkills: t.starting_skills,
    startingEquipment: t.starting_equipment,
    tierAbilities: mapTypeTierAbilities(t.tier_abilities),
    contentVersion: t.content_version,
  }
}

export function mapDescriptor(d: WithVersion<Descriptor>) {
  return {
    id: d.id,
    name: mapLocalizedString(d.name),
    description: mapLocalizedString(d.description),
    skillBonuses: d.skill_bonuses,
    skillInabilities: d.skill_inabilities,
    initialBonus: mapLocalizedString(d.initial_bonus),
    connectionText: mapLocalizedString(d.connection_text),
    contentVersion: d.content_version,
  }
}

export function mapFocus(f: WithVersion<Focus>) {
  return {
    id: f.id,
    name: mapLocalizedString(f.name),
    description: mapLocalizedString(f.description),
    connectionText: mapLocalizedString(f.connection_text),
    tierAbilities: mapFocusTierAbilities(f.tier_abilities),
    contentVersion: f.content_version,
  }
}

export function mapAbility(a: WithVersion<Ability>) {
  return {
    id: a.id,
    name: mapLocalizedString(a.name),
    description: mapLocalizedString(a.description),
    tier: a.tier,
    cost: a.cost ? { pool: a.cost.pool, amount: a.cost.amount } : null,
    actionType: a.action_type,
    sources: a.sources.map((s) => ({ type: s.type, id: s.id })),
    contentVersion: a.content_version,
  }
}

export function mapSkill(s: WithVersion<Skill>) {
  return {
    id: s.id,
    name: mapLocalizedString(s.name),
    description: mapLocalizedString(s.description),
    contentVersion: s.content_version,
  }
}

export function mapEquipmentItem(e: WithVersion<EquipmentItem>) {
  return {
    id: e.id,
    name: mapLocalizedString(e.name),
    description: mapLocalizedString(e.description),
    category: e.category,
    stats: e.stats
      ? {
          damage: e.stats.damage ?? null,
          armorValue: e.stats.armor_value ?? null,
          cost: e.stats.cost ?? null,
          weight: e.stats.weight ?? null,
        }
      : null,
    contentVersion: e.content_version,
  }
}

export function mapCypher(c: WithVersion<Cypher>) {
  return {
    id: c.id,
    name: mapLocalizedString(c.name),
    levelRange: c.level_range,
    category: c.category,
    effectText: mapLocalizedString(c.effect_text),
    contentVersion: c.content_version,
  }
}

export function mapArtifact(a: WithVersion<Artifact>) {
  return {
    id: a.id,
    name: mapLocalizedString(a.name),
    level: a.level,
    form: mapLocalizedString(a.form),
    depletionDie: a.depletion_die,
    effectText: mapLocalizedString(a.effect_text),
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
