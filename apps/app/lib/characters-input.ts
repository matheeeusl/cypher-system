import { INITIAL_CHOICES, type WizardChoices } from '@/components/wizard/state'

export const NAME_MAX = 80
export const BACKGROUND_MAX = 5000

const isString = (v: unknown): v is string => typeof v === 'string'
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)
const isNullableString = (v: unknown): v is string | null => v === null || isString(v)
const isCount = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100

/**
 * Server actions are public endpoints, so the wizard state arriving from the
 * browser is untrusted: rebuild a WizardChoices from known fields only.
 * Returns null when the shape is wrong. (Whether the *values* make a legal
 * character is checked separately against the rules API.)
 */
export function parseChoices(raw: unknown): WizardChoices | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const pool = r.poolAllocation as Record<string, unknown> | undefined
  const edge = r.startingEdgeChoice

  if (
    !isNullableString(r.typeId) ||
    !isNullableString(r.descriptorId) ||
    !isNullableString(r.focusId) ||
    !(edge === null || edge === 'MIGHT' || edge === 'SPEED' || edge === 'INTELLECT') ||
    !isStringArray(r.descriptorSkillChoices) ||
    !isStringArray(r.tier1TypeAbilityIds) ||
    !Array.isArray(r.focusChoiceSelections) ||
    !r.focusChoiceSelections.every((a) => Array.isArray(a) && a.every(isCount)) ||
    !pool ||
    !isCount(pool.might) ||
    !isCount(pool.speed) ||
    !isCount(pool.intellect) ||
    !isString(r.name) ||
    !isString(r.background)
  ) {
    return null
  }

  const name = r.name.trim()
  if (name.length === 0 || name.length > NAME_MAX || r.background.length > BACKGROUND_MAX) {
    return null
  }

  return {
    ...INITIAL_CHOICES,
    typeId: r.typeId,
    startingEdgeChoice: edge,
    descriptorId: r.descriptorId,
    descriptorSkillChoices: r.descriptorSkillChoices,
    focusId: r.focusId,
    focusChoiceSelections: r.focusChoiceSelections as number[][],
    poolAllocation: { might: pool.might, speed: pool.speed, intellect: pool.intellect },
    tier1TypeAbilityIds: r.tier1TypeAbilityIds,
    name,
    background: r.background,
  }
}
