import { INITIAL_CHOICES, type WizardChoices } from '@/components/wizard/state'

export const NAME_MAX = 80
export const BACKGROUND_MAX = 5000

const isString = (v: unknown): v is string => typeof v === 'string'
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)
const isNullableString = (v: unknown): v is string | null => v === null || isString(v)
const isCount = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100

/** {key: skill ids} with a bounded size; keys look like "type:1:physical-skills". */
function parseSkillChoices(raw: unknown): Record<string, string[]> | null {
  if (raw === undefined) return {} // saved before skill choices existed
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const entries = Object.entries(raw)
  if (entries.length > 20) return null
  const out: Record<string, string[]> = {}
  for (const [key, ids] of entries) {
    if (!/^(type|focus):[1-6]:[a-z0-9-]{1,100}$/.test(key)) return null
    if (!isStringArray(ids) || ids.length > 10) return null
    out[key] = ids
  }
  return out
}

/**
 * Rebuilds a WizardChoices from known fields only, checking just the shape —
 * a half-finished wizard (empty name, no Type yet) is fine. Used both for
 * untrusted server-action input and for restoring a browser-side draft.
 * Returns null when the shape is wrong.
 */
export function parseWizardState(raw: unknown): WizardChoices | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const pool = r.poolAllocation as Record<string, unknown> | undefined
  const edge = r.startingEdgeChoice
  const abilitySkillChoices = parseSkillChoices(r.abilitySkillChoices)

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
    !abilitySkillChoices ||
    !isString(r.name) ||
    !isString(r.background)
  ) {
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
    abilitySkillChoices,
    name: r.name,
    background: r.background,
  }
}

/**
 * Server actions are public endpoints, so a character arriving from the
 * browser is untrusted: same shape check as above, plus the rules for a
 * *saved* character (non-empty name, size caps). Whether the values make a
 * legal character is checked separately against the rules API.
 */
export function parseChoices(raw: unknown): WizardChoices | null {
  const state = parseWizardState(raw)
  if (!state) return null

  const name = state.name.trim()
  if (name.length === 0 || name.length > NAME_MAX || state.background.length > BACKGROUND_MAX) {
    return null
  }
  return { ...state, name }
}
