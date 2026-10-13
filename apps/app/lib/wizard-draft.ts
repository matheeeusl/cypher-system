import { STEPS, type WizardChoices } from '@/components/wizard/state'
import { parseWizardState } from '@/lib/characters-input'

// An unsaved wizard survives language switches and accidental reloads by
// living in sessionStorage (per tab, gone when the tab closes). Every access
// is wrapped: storage can be blocked or full, and the wizard must work anyway.

export interface WizardDraft {
  choices: WizardChoices
  stepIndex: number
}

const key = (characterId: string | undefined) => `cypher-wizard-draft:${characterId ?? 'new'}`

export function loadDraft(characterId: string | undefined): WizardDraft | null {
  try {
    const raw = window.sessionStorage.getItem(key(characterId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { choices?: unknown; stepIndex?: unknown }
    const choices = parseWizardState(parsed.choices)
    const { stepIndex } = parsed
    if (
      !choices ||
      typeof stepIndex !== 'number' ||
      !Number.isInteger(stepIndex) ||
      stepIndex < 0 ||
      stepIndex >= STEPS.length
    ) {
      return null
    }
    return { choices, stepIndex }
  } catch {
    return null
  }
}

export function saveDraft(characterId: string | undefined, draft: WizardDraft): void {
  try {
    window.sessionStorage.setItem(key(characterId), JSON.stringify(draft))
  } catch {
    // Draft just won't survive a reload — fine.
  }
}

export function clearDraft(characterId: string | undefined): void {
  try {
    window.sessionStorage.removeItem(key(characterId))
  } catch {
    // Nothing to clear.
  }
}
