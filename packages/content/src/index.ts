export { LocalizedString, type WithVersion } from './schemas/shared.js'

export { AbilitySchema, type Ability } from './schemas/ability.js'
export { TypeSchema, type Type } from './schemas/type.js'
export { DescriptorSchema, type Descriptor } from './schemas/descriptor.js'
export { FocusSchema, type Focus } from './schemas/focus.js'
export {
  FocusConnectionTableSchema,
  type FocusConnectionTable,
} from './schemas/focus-connection-table.js'
export { SkillSchema, type Skill } from './schemas/skill.js'
export { CypherSchema, type Cypher } from './schemas/cypher.js'
export { ArtifactSchema, type Artifact } from './schemas/artifact.js'
export { OdditySchema, type Oddity } from './schemas/oddity.js'
export {
  WeaponCategoryTableSchema,
  type WeaponCategoryTable,
} from './schemas/weapon-category-table.js'
export {
  ArmorCategoryTableSchema,
  type ArmorCategoryTable,
} from './schemas/armor-category-table.js'
export { PriceTierTableSchema, type PriceTierTable } from './schemas/price-tier-table.js'
export { AmmunitionSchema, type Ammunition } from './schemas/ammunition.js'

export {
  getAllTypes,
  getTypeById,
  getAllAbilities,
  getAbilityById,
  getAllDescriptors,
  getDescriptorById,
  getAllFoci,
  getFocusById,
  getAllSkills,
  getSkillById,
  getAllCyphers,
  getCypherById,
  getAllArtifacts,
  getArtifactById,
  getAllOddities,
  getOddityById,
  getFocusConnectionTable,
  getWeaponCategoryTable,
  getArmorCategoryTable,
  getPriceTierTable,
  getAmmunition,
} from './loader.js'
