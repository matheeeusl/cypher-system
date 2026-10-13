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
  | 'SKILL_CHOICE_COUNT'
  | 'SKILL_CHOICE_DUPLICATE'
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
