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
        startingEquipment: {
          clothing: boolean
          weapon: LocalizedStringPayload | null
          items: Array<{ priceTier: string; count: number; exact: boolean }>
        }
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
          startingEquipment {
            clothing
            weapon { en ptBR }
            items { priceTier count exact }
          }
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

    // Real per-Type data (Warrior trades a second expensive item for a
    // second weapon, unlike the other 3 Types) — not a universal rule, so
    // pinned exactly rather than loosely matched.
    expect(result.data.type?.startingEquipment).toEqual({
      clothing: true,
      weapon: { en: 'two weapons of your choice', ptBR: 'Tradução em breve.' },
      items: [
        { priceTier: 'EXPENSIVE', count: 1, exact: true },
        { priceTier: 'MODERATELY_PRICED', count: 2, exact: true },
        { priceTier: 'INEXPENSIVE', count: 4, exact: false },
      ],
    })

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

  it('resolves a Descriptor, including pool bonus, skill training, and connection options', async () => {
    interface DescriptorQueryData {
      descriptor: {
        id: string
        poolBonus: Array<{ stat: string; amount: number }>
        characteristics: Array<{ name: LocalizedStringPayload; description: LocalizedStringPayload }>
        skillTraining: Array<{ skillId: string | null; choiceCount: number | null }>
        inabilities: LocalizedStringPayload[]
        additionalEquipment: LocalizedStringPayload | null
        connectionOptions: LocalizedStringPayload[]
      } | null
    }

    const result = await graphqlRequest<DescriptorQueryData>(`
      query {
        descriptor(id: "strong") {
          id
          poolBonus { stat amount }
          characteristics { name { en ptBR } description { en ptBR } }
          skillTraining { skillId choiceCount }
          inabilities { en ptBR }
          additionalEquipment { en ptBR }
          connectionOptions { en ptBR }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // Real data from content/descriptors/strong.yaml — pinned so a future
    // content or mapper regression (e.g. dropping a field, or wiring the
    // wrong source through mapDescriptor) fails loudly.
    expect(result.data.descriptor).toEqual({
      id: 'strong',
      poolBonus: [{ stat: 'MIGHT', amount: 4 }],
      characteristics: [],
      skillTraining: [
        { skillId: 'breaking-inanimate-objects', choiceCount: null },
        { skillId: 'jumping', choiceCount: null },
      ],
      inabilities: [],
      additionalEquipment: {
        en: 'You have an extra medium weapon or heavy weapon.',
        ptBR: 'Tradução em breve.',
      },
      connectionOptions: [
        {
          en: "Against your better judgment, you joined the other PCs because you saw that they were in danger.",
          ptBR: 'Contra seu melhor julgamento, você se juntou aos outros PJs porque viu que estavam em perigo.',
        },
        {
          en: 'One of the other PCs convinced you that joining the group would be in your best interests.',
          ptBR: 'Um dos outros PJs o convenceu de que se juntar ao grupo seria do seu interesse.',
        },
        {
          en: "You're afraid of what might happen if the other PCs fail.",
          ptBR: 'Você teme o que pode acontecer se os outros PJs falharem.',
        },
        {
          en: 'There is reward involved, and you need the money.',
          ptBR: 'Há uma recompensa envolvida, e você precisa do dinheiro.',
        },
      ],
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
        typeSwapOption: { abilityId: string } | null
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
          typeSwapOption { abilityId }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // Real data: Wields Two Weapons at Once has no type swap option per the
    // rulebook — confirms the field is wired through and correctly null,
    // not silently absent from the query.
    expect(result.data.focus?.typeSwapOption).toBeNull()
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

})
