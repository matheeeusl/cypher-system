import { isSkillIdShape } from '@/lib/custom-skill'
import type { Stat } from '@/lib/graphql/queries'
import {
  INITIAL_CHOICES,
  type DescriptorPoolChoice,
  type WizardChoices,
} from '@/components/wizard/state'

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
    if (!Array.isArray(ids) || ids.length > 10 || !ids.every(isSkillIdShape)) return null
    out[key] = ids as string[]
  }
  return out
}

/** {key: ability ids} for tier-1 choice abilities; keys look like "type:1:blessing-of-the-gods". */
function parseAbilityChoices(raw: unknown): Record<string, string[]> | null {
  if (raw === undefined) return {} // saved before choice abilities existed
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const entries = Object.entries(raw)
  if (entries.length > 10) return null
  const out: Record<string, string[]> = {}
  for (const [key, ids] of entries) {
    if (!/^type:1:[a-z0-9-]{1,100}$/.test(key)) return null
    if (!Array.isArray(ids) || ids.length > 60) return null
    if (!ids.every((id) => isString(id) && /^[a-z0-9][a-z0-9-]{0,99}$/.test(id))) return null
    out[key] = ids as string[]
  }
  return out
}

/** {key: stat} for tier-1 Improved Edge picks; keys look like "type:1:improved-edge". */
function parseEdgeChoices(raw: unknown): Record<string, Stat> | null {
  if (raw === undefined) return {} // saved before Edge picks existed
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const entries = Object.entries(raw)
  if (entries.length > 10) return null
  const out: Record<string, Stat> = {}
  for (const [key, stat] of entries) {
    if (!/^(type|focus):1:[a-z0-9-]{1,100}$/.test(key)) return null
    if (stat !== 'MIGHT' && stat !== 'SPEED' && stat !== 'INTELLECT') return null
    out[key] = stat
  }
  return out
}

/**
 * The Descriptor Pool bonus choice: `{ allocation }` or `{ optionIndex }`.
 * Whether it fits the Descriptor is checked later (isStepValid, the API).
 * Returns undefined when the shape is wrong.
 */
function parsePoolChoice(raw: unknown): DescriptorPoolChoice | null | undefined {
  if (raw === undefined || raw === null) return null // saved before this existed, or none
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const r = raw as Record<string, unknown>
  const keys = Object.keys(r)
  if (keys.length !== 1) return undefined
  if (keys[0] === 'optionIndex')
    return isCount(r.optionIndex) ? { optionIndex: r.optionIndex } : undefined
  if (keys[0] !== 'allocation') return undefined
  const a = r.allocation as Record<string, unknown> | null
  if (typeof a !== 'object' || a === null) return undefined
  if (!isCount(a.might) || !isCount(a.speed) || !isCount(a.intellect)) return undefined
  return { allocation: { might: a.might, speed: a.speed, intellect: a.intellect } }
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
  // Saved (or drafted) before flavors existed: no key means no flavor.
  const flavorId = r.flavorId === undefined ? null : r.flavorId
  const abilitySkillChoices = parseSkillChoices(r.abilitySkillChoices)
  const abilityChoices = parseAbilityChoices(r.abilityChoices)
  const abilityEdgeChoices = parseEdgeChoices(r.abilityEdgeChoices)
  const descriptorPoolChoice = parsePoolChoice(r.descriptorPoolChoice)

  if (
    !isNullableString(r.typeId) ||
    !isNullableString(r.descriptorId) ||
    !isNullableString(r.focusId) ||
    !isNullableString(flavorId) ||
    !(edge === null || edge === 'MIGHT' || edge === 'SPEED' || edge === 'INTELLECT') ||
    !Array.isArray(r.descriptorSkillChoices) ||
    r.descriptorSkillChoices.length > 10 ||
    !r.descriptorSkillChoices.every(isSkillIdShape) ||
    !isStringArray(r.tier1TypeAbilityIds) ||
    !Array.isArray(r.focusChoiceSelections) ||
    !r.focusChoiceSelections.every((a) => Array.isArray(a) && a.every(isCount)) ||
    !pool ||
    !isCount(pool.might) ||
    !isCount(pool.speed) ||
    !isCount(pool.intellect) ||
    !abilitySkillChoices ||
    !abilityChoices ||
    !abilityEdgeChoices ||
    descriptorPoolChoice === undefined ||
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
    descriptorPoolChoice,
    focusId: r.focusId,
    flavorId,
    focusChoiceSelections: r.focusChoiceSelections as number[][],
    poolAllocation: { might: pool.might, speed: pool.speed, intellect: pool.intellect },
    tier1TypeAbilityIds: r.tier1TypeAbilityIds,
    abilitySkillChoices,
    abilityChoices,
    abilityEdgeChoices,
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
