import { gqlRequest } from '@/lib/graphql/client'
import type { LocalizedString } from '@/lib/graphql/queries'

export type CypherCategory = 'MANIFEST' | 'FANTASTIC' | 'SUBTLE' | 'POWER_BOOST'

export interface CatalogCypher {
  id: string
  name: LocalizedString
  category: CypherCategory
  levelRange: string
  effectText: LocalizedString
  /** A table to roll on after the main effect (not every cypher has one). */
  effectTable: {
    label: LocalizedString
    entries: Array<{ range: string; text: LocalizedString }>
  } | null
}

const CYPHERS_QUERY = `
  query Cyphers {
    cyphers {
      id
      name { en ptBR }
      category
      levelRange
      effectText { en ptBR }
      effectTable { label { en ptBR } entries { range text { en ptBR } } }
    }
  }
`

export async function fetchCyphers(): Promise<CatalogCypher[]> {
  const { cyphers } = await gqlRequest<{ cyphers: CatalogCypher[] }>(CYPHERS_QUERY)
  return cyphers
}

const CYPHER_QUERY = `
  query Cypher($id: ID!) {
    cypher(id: $id) {
      id
      name { en ptBR }
      category
      levelRange
      effectText { en ptBR }
      effectTable { label { en ptBR } entries { range text { en ptBR } } }
    }
  }
`

export async function fetchCypher(id: string): Promise<CatalogCypher | null> {
  const { cypher } = await gqlRequest<{ cypher: CatalogCypher | null }, { id: string }>(
    CYPHER_QUERY,
    { id },
  )
  return cypher
}
