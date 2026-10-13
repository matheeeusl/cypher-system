import { characterLimit } from '@/lib/entitlements'
import { pool } from '@/lib/db'
import type { LocalizedString } from '@/lib/graphql/queries'
import type { WizardChoices } from '@/components/wizard/state'

export interface CharacterSummaryData {
  typeName: LocalizedString
  descriptorName: LocalizedString
  focusName: LocalizedString
  tier: number
}

export interface SavedCharacter {
  id: string
  name: string
  choices: WizardChoices
  summary: CharacterSummaryData
  contentVersions: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

interface Row {
  id: string
  name: string
  choices: WizardChoices
  summary: CharacterSummaryData
  content_versions: Record<string, string>
  created_at: Date
  updated_at: Date
}

function fromRow(r: Row): SavedCharacter {
  return {
    id: r.id,
    name: r.name,
    choices: r.choices,
    summary: r.summary,
    contentVersions: r.content_versions,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

const COLUMNS = 'id, name, choices, summary, content_versions, created_at, updated_at'

// Authorization lives here (no RLS): every query is scoped to `userId`, which
// callers must take from the verified session — never from client input.

export async function listCharacters(userId: string): Promise<SavedCharacter[]> {
  const { rows } = await pool.query<Row>(
    `select ${COLUMNS} from character where user_id = $1 order by updated_at desc`,
    [userId],
  )
  return rows.map(fromRow)
}

export async function getCharacter(userId: string, id: string): Promise<SavedCharacter | null> {
  const { rows } = await pool.query<Row>(
    `select ${COLUMNS} from character where id = $1 and user_id = $2`,
    [id, userId],
  )
  return rows[0] ? fromRow(rows[0]) : null
}

export type CharacterData = Pick<SavedCharacter, 'name' | 'choices' | 'summary' | 'contentVersions'>

export class CharacterLimitError extends Error {}

export async function createCharacter(userId: string, data: CharacterData): Promise<string> {
  const limit = await characterLimit(userId)
  if (limit !== null) {
    const { rows } = await pool.query<{ count: string }>(
      'select count(*) from character where user_id = $1',
      [userId],
    )
    if (Number(rows[0]?.count ?? 0) >= limit) throw new CharacterLimitError()
  }

  const { rows } = await pool.query<{ id: string }>(
    `insert into character (user_id, name, choices, summary, content_versions)
     values ($1, $2, $3, $4, $5) returning id`,
    [userId, data.name, data.choices, data.summary, data.contentVersions],
  )
  return rows[0]!.id
}

/** Returns false when the character doesn't exist or belongs to someone else. */
export async function updateCharacter(
  userId: string,
  id: string,
  data: CharacterData,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `update character
        set name = $3, choices = $4, summary = $5, content_versions = $6, updated_at = now()
      where id = $1 and user_id = $2`,
    [id, userId, data.name, data.choices, data.summary, data.contentVersions],
  )
  return (rowCount ?? 0) > 0
}

export async function deleteCharacter(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await pool.query('delete from character where id = $1 and user_id = $2', [
    id,
    userId,
  ])
  return (rowCount ?? 0) > 0
}
