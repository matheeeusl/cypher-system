import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from 'yaml'
import type { ZodType } from 'zod'

import { AbilitySchema, type Ability } from './schemas/ability.js'
import { AmmunitionSchema, type Ammunition } from './schemas/ammunition.js'
import {
  AnimalFormMinorAbilitiesTableSchema,
  type AnimalFormMinorAbilitiesTable,
} from './schemas/animal-form-minor-abilities-table.js'
import {
  ArmorCategoryTableSchema,
  type ArmorCategoryTable,
} from './schemas/armor-category-table.js'
import { ArtifactSchema, type Artifact } from './schemas/artifact.js'
import { CypherSchema, type Cypher } from './schemas/cypher.js'
import {
  DescriptorCategoryTableSchema,
  DescriptorSchema,
  type Descriptor,
  type DescriptorCategoryTable,
} from './schemas/descriptor.js'
import { FlavorSchema, type Flavor } from './schemas/flavor.js'
import { FocusSchema, type Focus } from './schemas/focus.js'
import {
  FocusConnectionTableSchema,
  type FocusConnectionTable,
} from './schemas/focus-connection-table.js'
import {
  MutantMutationTableSchema,
  type MutantMutationTable,
} from './schemas/mutant-mutation-table.js'
import { OdditySchema, type Oddity } from './schemas/oddity.js'
import { PriceTierTableSchema, type PriceTierTable } from './schemas/price-tier-table.js'
import type { WithVersion } from './schemas/shared.js'
import { SkillSchema, type Skill } from './schemas/skill.js'
import { TypeSchema, type Type } from './schemas/type.js'
import {
  WeaponCategoryTableSchema,
  type WeaponCategoryTable,
} from './schemas/weapon-category-table.js'

const CONTENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../data')

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

// For data/reference-tables/: a single shared table, not a directory of
// per-id entities — see "Conventions" in this package's CLAUDE.md. No
// content_version: nothing snapshots against a reference table.
function loadReferenceTable<T>(filename: string, schema: ZodType<T>): T {
  const path = join(CONTENT_ROOT, 'reference-tables', filename)
  const raw = readFileSync(path, 'utf-8')
  const parsed: unknown = parse(raw)

  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Invalid content in reference-tables/${filename}: ${result.error.message}`)
  }

  return result.data
}

const types = loadEntities<Type>('types', TypeSchema)
const abilities = loadEntities<Ability>('abilities', AbilitySchema)
const descriptors = loadEntities<Descriptor>('descriptors', DescriptorSchema)
const foci = loadEntities<Focus>('foci', FocusSchema)
const flavors = loadEntities<Flavor>('flavors', FlavorSchema)
const skills = loadEntities<Skill>('skills', SkillSchema)
const cyphers = loadEntities<Cypher>('cyphers', CypherSchema)
const artifacts = loadEntities<Artifact>('artifacts', ArtifactSchema)
const oddities = loadEntities<Oddity>('oddities', OdditySchema)

const focusConnectionTable = loadReferenceTable<FocusConnectionTable>(
  'focus-connections.yaml',
  FocusConnectionTableSchema,
)
const weaponCategoryTable = loadReferenceTable<WeaponCategoryTable>(
  'weapon-categories.yaml',
  WeaponCategoryTableSchema,
)
const armorCategoryTable = loadReferenceTable<ArmorCategoryTable>(
  'armor-categories.yaml',
  ArmorCategoryTableSchema,
)
const priceTierTable = loadReferenceTable<PriceTierTable>('price-tiers.yaml', PriceTierTableSchema)
const ammunition = loadReferenceTable<Ammunition>('ammunition.yaml', AmmunitionSchema)
const animalFormMinorAbilitiesTable = loadReferenceTable<AnimalFormMinorAbilitiesTable>(
  'animal-form-minor-abilities.yaml',
  AnimalFormMinorAbilitiesTableSchema,
)
const descriptorCategoryTable = loadReferenceTable<DescriptorCategoryTable>(
  'descriptor-categories.yaml',
  DescriptorCategoryTableSchema,
)
const mutantMutationTable = loadReferenceTable<MutantMutationTable>(
  'mutant-mutations.yaml',
  MutantMutationTableSchema,
)

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

export function getAllFlavors(): WithVersion<Flavor>[] {
  return [...flavors.values()]
}
export function getFlavorById(id: string): WithVersion<Flavor> | undefined {
  return flavors.get(id)
}

export function getAllSkills(): WithVersion<Skill>[] {
  return [...skills.values()]
}
export function getSkillById(id: string): WithVersion<Skill> | undefined {
  return skills.get(id)
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

export function getFocusConnectionTable(): FocusConnectionTable {
  return focusConnectionTable
}

export function getWeaponCategoryTable(): WeaponCategoryTable {
  return weaponCategoryTable
}

export function getArmorCategoryTable(): ArmorCategoryTable {
  return armorCategoryTable
}

export function getPriceTierTable(): PriceTierTable {
  return priceTierTable
}

export function getAmmunition(): Ammunition {
  return ammunition
}

export function getAnimalFormMinorAbilitiesTable(): AnimalFormMinorAbilitiesTable {
  return animalFormMinorAbilitiesTable
}

/** The descriptor groups (Standard, Cyberpunk…) in the book's order. */
export function getDescriptorCategoryTable(): DescriptorCategoryTable {
  return descriptorCategoryTable
}

/** The Mutant descriptor's five d100 mutation tables. */
export function getMutantMutationTable(): MutantMutationTable {
  return mutantMutationTable
}
