export { LocalizedString, type WithVersion } from './schemas/shared.js'

export { AbilitySchema, type Ability } from './schemas/ability.js'
export { TypeSchema, type Type } from './schemas/type.js'
export { DescriptorSchema, type Descriptor } from './schemas/descriptor.js'
export { FocusSchema, type Focus } from './schemas/focus.js'
export { SkillSchema, type Skill } from './schemas/skill.js'
export { EquipmentItemSchema, type EquipmentItem } from './schemas/equipment-item.js'
export { CypherSchema, type Cypher } from './schemas/cypher.js'
export { ArtifactSchema, type Artifact } from './schemas/artifact.js'
export { OdditySchema, type Oddity } from './schemas/oddity.js'

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
  getAllEquipment,
  getEquipmentById,
  getAllCyphers,
  getCypherById,
  getAllArtifacts,
  getArtifactById,
  getAllOddities,
  getOddityById,
} from './loader.js'
