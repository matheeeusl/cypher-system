/**
 * Machine-readable identity for every way a set of character choices can be
 * invalid. `message` stays the English sentence (tests and logs rely on it);
 * UIs translate from `code` + `params` instead of parsing that sentence.
 */
export type RuleErrorCode =
  | 'STARTING_EDGE_REQUIRED'
  | 'STARTING_EDGE_INVALID'
  | 'STARTING_EDGE_NOT_ALLOWED'
  | 'FOCUS_SELECTION_MISSING'
  | 'FOCUS_SELECTION_INVALID'
  | 'FOCUS_BLOCKED_BY_TIER'
  | 'POOL_ALLOCATION_NEGATIVE'
  | 'POOL_ALLOCATION_SUM'
  | 'DESCRIPTOR_POOL_CHOICE_REQUIRED'
  | 'DESCRIPTOR_POOL_CHOICE_UNEXPECTED'
  | 'DESCRIPTOR_POOL_CHOICE_STAT'
  | 'DESCRIPTOR_POOL_CHOICE_SUM'
  | 'DESCRIPTOR_POOL_CHOICE_OPTION'
  | 'SKILL_CHOICE_COUNT'
  | 'SKILL_CHOICE_DUPLICATE'
  | 'SKILL_CHOICE_INVALID'
  | 'SKILL_ALREADY_MAXED'
  | 'ABILITY_TRAINING_UNKNOWN'
  | 'ABILITY_TRAINING_BLOCKED'
  | 'TIER_SUBSTITUTION_UNSUPPORTED'
  | 'TIER_DUPLICATE_OPTION'
  | 'TIER_INCOMPLETE'
  | 'TIER_GAP'
  | 'TYPE_ABILITY_COUNT'
  | 'TYPE_ABILITY_DUPLICATE'
  | 'TYPE_ABILITY_UNAVAILABLE'
  | 'TYPE_PICKS_TOO_MANY'
  | 'TYPE_PICKS_UNAVAILABLE'
  | 'TYPE_PICKS_DUPLICATE'
  | 'TYPE_PICKS_FUTURE_TIER'
  | 'TIER_TOO_HIGH'
  | 'FLAVOR_UNKNOWN'
  | 'FLAVOR_GAIN_CONFLICT'
  | 'FLAVOR_SWAP_REPLACES_INVALID'
  | 'FLAVOR_SWAP_WITH_INVALID'
  | 'FLAVOR_SWAP_DUPLICATE'
  | 'FLAVOR_SWAP_REPICKED'
  | 'ABILITY_CHOICE_COUNT'
  | 'ABILITY_CHOICE_INVALID'
  | 'ABILITY_CHOICE_DUPLICATE'
  | 'ABILITY_CHOICE_UNKNOWN'
  | 'LEARN_NOT_AVAILABLE'
  | 'LEARN_COUNT'
  | 'LEARN_INVALID'
  | 'LEARN_DUPLICATE'
  | 'ABILITY_SKILL_CHOICE_COUNT'
  | 'ABILITY_SKILL_CHOICE_INVALID'
  | 'ABILITY_SKILL_CHOICE_DUPLICATE'
  | 'ABILITY_SKILL_CHOICE_UNKNOWN'
  | 'ABILITY_SKILL_CHOICE_MAXED'
  | 'ABILITY_SKILL_CHOICE_NOT_TRAINED'
  | 'EDGE_CHOICE_UNKNOWN'
  | 'EDGE_CHOICE_NOT_ZERO'
  | 'UNKNOWN'

export type RuleErrorParams = Record<string, string | number>

export interface ValidationIssue {
  code: RuleErrorCode
  params: RuleErrorParams
}

export class CharacterRuleError extends Error {
  constructor(
    readonly code: RuleErrorCode,
    message: string,
    readonly params: RuleErrorParams = {},
  ) {
    super(message)
    this.name = 'CharacterRuleError'
  }
}
