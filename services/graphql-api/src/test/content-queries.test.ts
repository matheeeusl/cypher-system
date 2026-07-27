import { describe, expect, it } from 'vitest'

import { graphqlRequest } from './helpers.js'

interface LocalizedStringPayload {
  en: string
  ptBR: string
}

describe('content queries', () => {
  it('resolves a single Type by id, including localized text and grouped tier abilities', async () => {
    interface TypeQueryData {
      type: {
        id: string
        name: LocalizedStringPayload
        description: {
          individualRole: LocalizedStringPayload
          groupRole: LocalizedStringPayload
          societalRole: LocalizedStringPayload
        }
        playerIntrusions: Array<{ name: LocalizedStringPayload; description: LocalizedStringPayload }>
        startingPools: { might: number; speed: number; intellect: number }
        startingEdge: { statChoices: string[]; amount: number }
        weaponProficiency: { practiced: string[]; inability: string[] }
        specialAbilityId: string | null
        tierAbilities: Array<{ tier: number; abilityIds: string[] }>
        contentVersion: string
      } | null
    }

    const result = await graphqlRequest<TypeQueryData>(`
      query {
        type(id: "warrior") {
          id
          name { en ptBR }
          description {
            individualRole { en ptBR }
            groupRole { en ptBR }
            societalRole { en ptBR }
          }
          playerIntrusions {
            name { en ptBR }
            description { en ptBR }
          }
          startingPools { might speed intellect }
          startingEdge { statChoices amount }
          weaponProficiency { practiced inability }
          specialAbilityId
          tierAbilities { tier abilityIds }
          contentVersion
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.type).toMatchObject({
      id: 'warrior',
      name: { en: 'Warrior', ptBR: 'Guerreiro' },
      startingPools: { might: 10, speed: 10, intellect: 8 },
      startingEdge: { statChoices: ['MIGHT', 'SPEED'], amount: 1 },
      weaponProficiency: { practiced: ['LIGHT', 'MEDIUM', 'HEAVY'], inability: [] },
      specialAbilityId: null,
    })
    // Real rulebook text from content/types/warrior.yaml, not a paraphrase —
    // pinned so a future content or mapper regression (e.g. dropping a role,
    // or wiring the wrong field through mapType) fails loudly instead of
    // silently passing behind a loose toMatchObject.
    expect(result.data.type?.description.individualRole.en).toBe(
      "Warriors are physical, action-oriented people. They're more likely to overcome a challenge using force than by other means, and they often take the most straightforward path toward their goals.",
    )
    expect(result.data.type?.description.groupRole.en).toContain(
      'Warriors usually take and deal the most punishment in a dangerous situation.',
    )
    expect(result.data.type?.description.societalRole.en).toContain(
      "Warriors aren't always soldiers or mercenaries.",
    )
    expect(result.data.type?.description.individualRole.ptBR).toBe('Tradução em breve.')

    expect(result.data.type?.playerIntrusions).toHaveLength(3)
    expect(result.data.type?.playerIntrusions.map((i) => i.name.en)).toEqual([
      'Perfect Setup',
      'Old Friend',
      'Weapon Break',
    ])
    expect(result.data.type?.playerIntrusions[2]).toMatchObject({
      name: { en: 'Weapon Break', ptBR: 'Tradução em breve.' },
      description: {
        en: "Your foe's weapon has a weak spot. In the course of the combat, it quickly becomes damaged and moves two steps down the object damage track.",
      },
    })

    expect(result.data.type?.tierAbilities).toHaveLength(1)
    expect(result.data.type?.tierAbilities[0]).toMatchObject({ tier: 1 })
    for (const abilityId of ['bash', 'overwatch', 'swipe']) {
      expect(result.data.type?.tierAbilities[0]?.abilityIds).toContain(abilityId)
    }
    expect(typeof result.data.type?.contentVersion).toBe('string')
    expect(result.data.type?.contentVersion.length).toBeGreaterThan(0)
  })

  it('resolves the types list, including the known warrior fixture', async () => {
    interface TypesQueryData {
      types: Array<{ id: string }>
    }

    const result = await graphqlRequest<TypesQueryData>(`query { types { id } }`)

    expect(result.errors).toBeUndefined()
    expect(result.data.types.some((t) => t.id === 'warrior')).toBe(true)
  })

  it('returns null (not a GraphQL error) for an unknown Type id', async () => {
    interface TypeQueryData {
      type: { id: string } | null
    }

    const result = await graphqlRequest<TypeQueryData>(`query { type(id: "nonexistent") { id } }`)

    expect(result.errors).toBeUndefined()
    expect(result.data.type).toBeNull()
  })

  it('resolves a Descriptor, including the ptBR localized field', async () => {
    interface DescriptorQueryData {
      descriptor: {
        id: string
        skillBonuses: string[]
        skillInabilities: string[]
        initialBonus: LocalizedStringPayload
      } | null
    }

    const result = await graphqlRequest<DescriptorQueryData>(`
      query {
        descriptor(id: "strong") {
          id
          skillBonuses
          skillInabilities
          initialBonus { en ptBR }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.descriptor).toEqual({
      id: 'strong',
      skillBonuses: ['smashing', 'jumping'],
      skillInabilities: [],
      initialBonus: {
        en: 'Very Powerful: +4 to your Might Pool.',
        ptBR: 'Muito Poderoso: +4 ao seu Reservatório de Vigor.',
      },
    })
  })

  it('resolves a Focus, mapping its granted tier-ability entry through the FocusTierAbilityEntry union', async () => {
    interface FocusQueryData {
      focus: {
        id: string
        tierAbilities: Array<{
          tier: number
          entries: Array<{ __typename: string; abilityId?: string; options?: string[] }>
        }>
      } | null
    }

    const result = await graphqlRequest<FocusQueryData>(`
      query {
        focus(id: "wields-two-weapons-at-once") {
          id
          tierAbilities {
            tier
            entries {
              __typename
              ... on GrantedAbility { abilityId }
              ... on ChoiceAbility { options }
            }
          }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.focus?.tierAbilities).toEqual([
      {
        tier: 1,
        entries: [{ __typename: 'GrantedAbility', abilityId: 'dual-light-wield' }],
      },
    ])
  })

  it('resolves an Ability, including its cost and sources', async () => {
    interface AbilityQueryData {
      ability: {
        id: string
        tier: number
        cost: { pool: string; amount: number } | null
        actionType: string
        sources: Array<{ type: string; id: string }>
      } | null
    }

    const result = await graphqlRequest<AbilityQueryData>(`
      query {
        ability(id: "bash") {
          id
          tier
          cost { pool amount }
          actionType
          sources { type id }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.ability).toEqual({
      id: 'bash',
      tier: 1,
      cost: { pool: 'MIGHT', amount: 1 },
      actionType: 'ACTION',
      sources: [{ type: 'TYPE', id: 'warrior' }],
    })
  })

  it('resolves EquipmentItems, exposing only the stats fields each item actually has', async () => {
    interface EquipmentQueryData {
      equipment: Array<{
        id: string
        category: string
        stats: {
          damage: number | null
          armorValue: number | null
          cost: string | null
          weight: number | null
        } | null
      }>
    }

    const result = await graphqlRequest<EquipmentQueryData>(`
      query {
        equipment {
          id
          category
          stats { damage armorValue cost weight }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.equipment).toEqual(
      expect.arrayContaining([
        {
          id: 'adventuring-pack',
          category: 'GEAR',
          stats: { damage: null, armorValue: null, cost: 'INEXPENSIVE', weight: null },
        },
        {
          id: 'light-blade',
          category: 'WEAPON',
          stats: { damage: 2, armorValue: null, cost: 'MODERATELY_PRICED', weight: null },
        },
        {
          id: 'medium-armor',
          category: 'ARMOR',
          stats: { damage: null, armorValue: 2, cost: 'EXPENSIVE', weight: null },
        },
      ]),
    )
  })
})
