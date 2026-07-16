import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from 'yaml'
import type { ZodType } from 'zod'

import { AbilitySchema, type Ability } from './schemas/ability'
import { ArtifactSchema, type Artifact } from './schemas/artifact'
import { CypherSchema, type Cypher } from './schemas/cypher'
import { DescriptorSchema, type Descriptor } from './schemas/descriptor'
import { EquipmentItemSchema, type EquipmentItem } from './schemas/equipment-item'
import { FocusSchema, type Focus } from './schemas/focus'
import { OdditySchema, type Oddity } from './schemas/oddity'
import type { WithVersion } from './schemas/shared'
import { SkillSchema, type Skill } from './schemas/skill'
import { TypeSchema, type Type } from './schemas/type'

const CONTENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../content')

// Recursively sorts object keys before stringifying so content_version only
// changes when actual data changes, not when YAML key order or whitespace does.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )
    return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function contentVersion(parsed: unknown): string {
  return createHash('sha256').update(stableStringify(parsed)).digest('hex').slice(0, 12)
}

// Exported for tests only — the public API is the explicit getAllX/getXById
// functions below, not this generic runtime-dispatched helper.
export function loadEntities<T extends { id: string }>(
  category: string,
  schema: ZodType<T>,
): Map<string, WithVersion<T>> {
  const dir = join(CONTENT_ROOT, category)
  const entities = new Map<string, WithVersion<T>>()

  for (const filename of readdirSync(dir)) {
    if (!filename.endsWith('.yaml')) continue

    const raw = readFileSync(join(dir, filename), 'utf-8')
    const parsed: unknown = parse(raw)

    const result = schema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`Invalid content in ${category}/${filename}: ${result.error.message}`)
    }

    entities.set(result.data.id, { ...result.data, content_version: contentVersion(parsed) })
  }

  return entities
}

const types = loadEntities<Type>('types', TypeSchema)
const abilities = loadEntities<Ability>('abilities', AbilitySchema)
const descriptors = loadEntities<Descriptor>('descriptors', DescriptorSchema)
const foci = loadEntities<Focus>('foci', FocusSchema)
const skills = loadEntities<Skill>('skills', SkillSchema)
const equipment = loadEntities<EquipmentItem>('equipment', EquipmentItemSchema)
const cyphers = loadEntities<Cypher>('cyphers', CypherSchema)
const artifacts = loadEntities<Artifact>('artifacts', ArtifactSchema)
const oddities = loadEntities<Oddity>('oddities', OdditySchema)

export function getAllTypes(): WithVersion<Type>[] {
  return [...types.values()]
}
export function getTypeById(id: string): WithVersion<Type> | undefined {
  return types.get(id)
}

export function getAllAbilities(): WithVersion<Ability>[] {
  return [...abilities.values()]
}
export function getAbilityById(id: string): WithVersion<Ability> | undefined {
  return abilities.get(id)
}

export function getAllDescriptors(): WithVersion<Descriptor>[] {
  return [...descriptors.values()]
}
export function getDescriptorById(id: string): WithVersion<Descriptor> | undefined {
  return descriptors.get(id)
}

export function getAllFoci(): WithVersion<Focus>[] {
  return [...foci.values()]
}
export function getFocusById(id: string): WithVersion<Focus> | undefined {
  return foci.get(id)
}

export function getAllSkills(): WithVersion<Skill>[] {
  return [...skills.values()]
}
export function getSkillById(id: string): WithVersion<Skill> | undefined {
  return skills.get(id)
}

export function getAllEquipment(): WithVersion<EquipmentItem>[] {
  return [...equipment.values()]
}
export function getEquipmentById(id: string): WithVersion<EquipmentItem> | undefined {
  return equipment.get(id)
}

export function getAllCyphers(): WithVersion<Cypher>[] {
  return [...cyphers.values()]
}
export function getCypherById(id: string): WithVersion<Cypher> | undefined {
  return cyphers.get(id)
}

export function getAllArtifacts(): WithVersion<Artifact>[] {
  return [...artifacts.values()]
}
export function getArtifactById(id: string): WithVersion<Artifact> | undefined {
  return artifacts.get(id)
}

export function getAllOddities(): WithVersion<Oddity>[] {
  return [...oddities.values()]
}
export function getOddityById(id: string): WithVersion<Oddity> | undefined {
  return oddities.get(id)
}
