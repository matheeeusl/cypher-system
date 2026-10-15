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
        playerIntrusions: Array<{
          name: LocalizedStringPayload
          description: LocalizedStringPayload
        }>
        startingPools: { might: number; speed: number; intellect: number }
        startingEdge: { statChoices: string[]; amount: number }
        weaponProficiency: { practiced: string[]; inability: string[] }
        specialAbilityId: string | null
        cypherLimit: number
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
          cypherLimit
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
      cypherLimit: 2,
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
    expect(result.data.type?.description.individualRole.ptBR).toBe(
      'Guerreiros são pessoas voltadas para a ação e para o vigor físico. Costumam superar desafios pela força, em vez de recorrer a outros meios, e normalmente seguem o caminho mais direto para alcançar seus objetivos.',
    )

    // Real per-Type data (Warrior trades a second expensive item for a
    // second weapon, unlike the other 3 Types) — not a universal rule, so
    // pinned exactly rather than loosely matched.
    expect(result.data.type?.startingEquipment).toEqual({
      clothing: true,
      weapon: { en: 'two weapons of your choice', ptBR: 'duas armas à sua escolha' },
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
      name: { en: 'Weapon Break', ptBR: 'Ponto Fraco da Arma' },
      description: {
        en: "Your foe's weapon has a weak spot. In the course of the combat, it quickly becomes damaged and moves two steps down the object damage track.",
      },
    })

    // Warrior has ability lists for all 6 tiers, ordered by tier.
    expect(result.data.type?.tierAbilities.map((t) => t.tier)).toEqual([1, 2, 3, 4, 5, 6])
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
        characteristics: Array<{
          name: LocalizedStringPayload
          description: LocalizedStringPayload
        }>
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
        ptBR: 'Você tem uma arma média ou uma arma pesada adicional.',
      },
      connectionOptions: [
        {
          en: 'Against your better judgment, you joined the other PCs because you saw that they were in danger.',
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
          entries: Array<{ __typename: string; abilityId?: string; options?: string[][] }>
        }>
        typeSwapOption: { abilityIds: string[] } | null
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
          typeSwapOption { abilityIds }
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
      {
        tier: 2,
        entries: [
          { __typename: 'GrantedAbility', abilityId: 'double-strike' },
          { __typename: 'GrantedAbility', abilityId: 'infiltrator' },
        ],
      },
      {
        tier: 3,
        entries: [
          { __typename: 'ChoiceAbility', options: [['dual-medium-wield'], ['precise-cut']] },
        ],
      },
      {
        tier: 4,
        entries: [{ __typename: 'GrantedAbility', abilityId: 'dual-defense' }],
      },
      {
        tier: 5,
        entries: [{ __typename: 'GrantedAbility', abilityId: 'dual-distraction' }],
      },
      {
        tier: 6,
        entries: [
          { __typename: 'ChoiceAbility', options: [['disarming-attack'], ['spin-attack']] },
        ],
      },
    ])
  })

  it("resolves a Focus's typeSwapOption with more than one ability_id", async () => {
    interface FocusQueryData {
      focus: { typeSwapOption: { abilityIds: string[] } | null } | null
    }

    const result = await graphqlRequest<FocusQueryData>(`
      query {
        focus(id: "spits-fire-and-lead") {
          typeSwapOption { abilityIds }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // Spits Fire and Lead prints two abilities (Cogent Shot, Reload) under
    // one "TYPE SWAP OPTION" heading, both granted together.
    expect(result.data.focus?.typeSwapOption).toEqual({
      abilityIds: ['cogent-shot', 'reload'],
    })
  })

  it('resolves an Ability, including its cost and sources', async () => {
    interface AbilityQueryData {
      ability: {
        id: string
        cost: { pool: string; amount: number } | null
        actionType: string
        sources: Array<{ type: string; id: string; tier: number }>
      } | null
    }

    const result = await graphqlRequest<AbilityQueryData>(`
      query {
        ability(id: "bash") {
          id
          cost { pool amount }
          actionType
          sources { type id tier }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.ability).toEqual({
      id: 'bash',
      cost: { pool: 'MIGHT', amount: 1 },
      actionType: 'ACTION',
      sources: [
        { type: 'TYPE', id: 'warrior', tier: 1 },
        { type: 'FOCUS', id: 'weaponizes-chrome', tier: 1 },
      ],
    })
  })

  it('resolves an Ability that comes from a Flavor (Goad)', async () => {
    interface AbilityQueryData {
      ability: { sources: Array<{ type: string; id: string; tier: number }> } | null
    }

    const result = await graphqlRequest<AbilityQueryData>(`
      query {
        ability(id: "goad") {
          sources { type id tier }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // Goad is offered by Stealth and by Charms and Figments, both at tier 1.
    expect(result.data.ability?.sources).toEqual(
      expect.arrayContaining([
        { type: 'FLAVOR', id: 'stealth', tier: 1 },
        { type: 'FLAVOR', id: 'charms-and-figments', tier: 1 },
      ]),
    )
  })

  it('lists the flavors and resolves one with its per-tier abilities', async () => {
    interface FlavorQueryData {
      flavors: Array<{ id: string }>
      flavor: {
        id: string
        name: LocalizedStringPayload
        tierAbilities: Array<{ tier: number; abilityIds: string[] }>
      } | null
    }

    const result = await graphqlRequest<FlavorQueryData>(`
      query {
        flavors { id }
        flavor(id: "stealth") { id name { en ptBR } tierAbilities { tier abilityIds } }
        missing: flavor(id: "nope") { id }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.flavors.map((f) => f.id)).toEqual(
      expect.arrayContaining(['combat', 'stealth']),
    )
    expect(result.data.flavor?.name).toEqual({ en: 'Stealth', ptBR: 'Furtividade' })
    expect(result.data.flavor?.tierAbilities.map((g) => g.tier)).toEqual([1, 2, 3, 4, 5, 6])
    expect(result.data.flavor?.tierAbilities[0]?.abilityIds).toContain('goad')
    expect((result.data as unknown as { missing: unknown }).missing).toBeNull()
  })

  it('resolves a choice ability with its options and the back-reference on an option', async () => {
    interface ChoiceQueryData {
      blessing: { choice: { options: string[]; count: number } | null } | null
      war: { sources: Array<{ type: string; id: string }> } | null
    }

    const result = await graphqlRequest<ChoiceQueryData>(`
      query {
        blessing: ability(id: "blessing-of-the-gods") { choice { options count } }
        war: ability(id: "war") { sources { type id } }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.blessing?.choice?.count).toBe(2)
    expect(result.data.blessing?.choice?.options).toHaveLength(13)
    expect(result.data.war?.sources).toContainEqual({ type: 'ABILITY', id: 'blessing-of-the-gods' })
  })

  it('exposes what a choice ability can learn later for XP (Cantrips)', async () => {
    interface LearnQueryData {
      cantrips: { choice: { learn: { xpCost: number; count: number } | null } | null } | null
      blessing: { choice: { learn: unknown } | null } | null
    }

    const result = await graphqlRequest<LearnQueryData>(`
      query {
        cantrips: ability(id: "cantrips") { choice { learn { xpCost count } } }
        blessing: ability(id: "blessing-of-the-gods") { choice { learn { xpCost count } } }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.cantrips?.choice?.learn).toEqual({ xpCost: 2, count: 2 })
    expect(result.data.blessing?.choice?.learn).toBeNull()
  })

  it('resolves a fantastic Cypher with a nested effect table (Chemical Factory)', async () => {
    interface CypherQueryData {
      cypher: {
        id: string
        category: string
        pageRef: string
        levelRange: string
        effectTable: {
          label: LocalizedStringPayload
          entries: Array<{ range: string; text: LocalizedStringPayload }>
        } | null
      } | null
    }

    const result = await graphqlRequest<CypherQueryData>(`
      query {
        cypher(id: "chemical-factory") {
          id
          category
          pageRef
          levelRange
          effectTable {
            label { en ptBR }
            entries { range text { en ptBR } }
          }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // Real data from content/cyphers/chemical-factory.yaml — proves the
    // nested optional effect table actually resolves end-to-end, not just
    // that the common (null) case passes through.
    expect(result.data.cypher?.category).toBe('FANTASTIC')
    expect(result.data.cypher?.pageRef).toBe('Cypher System Rulebook, p. 385')
    expect(result.data.cypher?.levelRange).toBe('1d6')
    expect(result.data.cypher?.effectTable).not.toBeNull()
    expect(result.data.cypher?.effectTable?.entries).toHaveLength(15)
    expect(result.data.cypher?.effectTable?.entries[0]).toEqual({
      range: '01–04',
      text: { en: 'Euphoric for 1d6 hours', ptBR: 'Eufórico por 1d6 horas' },
    })
  })

  it('resolves a manifest Cypher with no effect table (Equipment Cache)', async () => {
    interface CypherQueryData {
      cypher: { id: string; category: string; effectTable: unknown } | null
    }

    const result = await graphqlRequest<CypherQueryData>(`
      query {
        cypher(id: "equipment-cache") {
          id
          category
          effectTable {
            label { en ptBR }
          }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // Most cyphers don't have a sub-table — confirms the common case
    // resolves to null rather than erroring or defaulting to {}.
    expect(result.data.cypher).toEqual({
      id: 'equipment-cache',
      category: 'MANIFEST',
      effectTable: null,
    })
  })

  it('resolves a power_boost Cypher (Energy Boost)', async () => {
    interface CypherQueryData {
      cypher: { id: string; category: string } | null
    }

    const result = await graphqlRequest<CypherQueryData>(`
      query {
        cypher(id: "energy-boost") {
          id
          category
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.cypher).toEqual({ id: 'energy-boost', category: 'POWER_BOOST' })
  })

  it('resolves an Artifact with a large nested effect table (Ozalid Folio)', async () => {
    interface ArtifactQueryData {
      artifact: {
        id: string
        effectTable: {
          label: LocalizedStringPayload
          entries: Array<{ range: string; text: LocalizedStringPayload }>
        } | null
      } | null
    }

    const result = await graphqlRequest<ArtifactQueryData>(`
      query {
        artifact(id: "ozalid-folio") {
          id
          effectTable {
            label { en ptBR }
            entries { range text { en ptBR } }
          }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // Real data from content/artifacts/ozalid-folio.yaml — 34 entries,
    // proving both the large-table case and that a plain-number range
    // ("100") works the same as a dice-range one ("1–3").
    expect(result.data.artifact?.effectTable?.entries).toHaveLength(34)
    expect(result.data.artifact?.effectTable?.entries[0]).toEqual({
      range: '1–3',
      text: { en: 'A fine porcelain tea kettle', ptBR: 'Uma fina chaleira de porcelana' },
    })
    expect(result.data.artifact?.effectTable?.entries[33]).toEqual({
      range: '100',
      text: { en: 'An old boot', ptBR: 'Uma bota velha' },
    })
  })

  it('resolves an Artifact with both an effect table and a flavor quote (Retro-Causality Weapon)', async () => {
    interface ArtifactQueryData {
      artifact: {
        id: string
        effectTable: { entries: Array<{ range: string }> } | null
        flavorQuote: LocalizedStringPayload | null
      } | null
    }

    const result = await graphqlRequest<ArtifactQueryData>(`
      query {
        artifact(id: "retro-causality-weapon") {
          id
          effectTable { entries { range } }
          flavorQuote { en ptBR }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // The one entry exercising effectTable and flavorQuote at once.
    expect(result.data.artifact?.effectTable?.entries).toHaveLength(6)
    expect(result.data.artifact?.flavorQuote?.en).toBe(
      "I don't think I was even married before I shot them. I probably shouldn't tell my kids that they're just a metacausal byproduct of finding an excuse to shoot someone; that's a hell of an existential crisis to inflict on a child. Nobody wants to have that conversation.",
    )
    expect(result.data.artifact?.flavorQuote?.ptBR).toBe(
      'Acho que eu nem era casado antes de atirar nele. Provavelmente não devo contar aos meus filhos que eles não passam de um subproduto metacausal de eu ter arranjado uma desculpa pra atirar em alguém; isso é uma baita crise existencial pra impor a uma criança. Ninguém quer ter essa conversa.',
    )
  })

  it('resolves an Artifact with real pt-BR translations and no effect table or flavor quote (Mind Imager)', async () => {
    interface ArtifactQueryData {
      artifact: {
        id: string
        name: LocalizedStringPayload
        form: LocalizedStringPayload
        effectText: LocalizedStringPayload
        effectTable: unknown
        flavorQuote: unknown
      } | null
    }

    const result = await graphqlRequest<ArtifactQueryData>(`
      query {
        artifact(id: "mind-imager") {
          id
          name { en ptBR }
          form { en ptBR }
          effectText { en ptBR }
          effectTable { entries { range } }
          flavorQuote { en ptBR }
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    // Mind Imager already has genuine Portuguese translations in content
    // (not the 'Tradução em breve.' placeholder every other test has been
    // implicitly checking against) — confirms the i18n path works
    // end-to-end with real non-English data, not just the placeholder.
    expect(result.data.artifact).toEqual({
      id: 'mind-imager',
      name: { en: 'Mind Imager', ptBR: 'Projetor Mental' },
      form: {
        en: 'Handheld device with a plastic panel screen and wires that must be affixed to the head of a creature.',
        ptBR: 'Dispositivo portátil com uma tela de painel plástico e fios que devem ser afixados na cabeça de uma criatura.',
      },
      effectText: {
        en: 'This device shows a visual image of what a creature is thinking. The affected creature need not be conscious.',
        ptBR: 'Este dispositivo mostra uma imagem visual do que uma criatura está pensando. A criatura afetada não precisa estar consciente.',
      },
      effectTable: null,
      flavorQuote: null,
    })
  })
})

describe('advancementRules query', () => {
  it('exposes the engine constants (4 XP per advancement, 4 advancements per tier)', async () => {
    const result = await graphqlRequest<{ advancementRules: { costXp: number; perTier: number } }>(
      `{ advancementRules { costXp perTier } }`,
    )
    expect(result.errors).toBeUndefined()
    expect(result.data.advancementRules).toEqual({ costXp: 4, perTier: 4 })
  })
})
