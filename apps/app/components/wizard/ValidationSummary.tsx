import type { ValidationResult } from '@/lib/graphql/queries'

import { issueStepId } from './derive'
import { ErrorBanner } from './ErrorBanner'
import { useWizardI18n } from './i18n'
import { STEPS } from './state'

interface ValidationSummaryProps {
  validation: ValidationResult | null
  validating: boolean
  /** Only issues fixed on this step or an earlier one are shown. */
  stepIndex: number
}

export function ValidationSummary({ validation, validating, stepIndex }: ValidationSummaryProps) {
  const { copy, terms } = useWizardI18n()
  if (!validation) return null

  if (validation.__typename === 'InvalidCharacterResult') {
    const messages = validation.errors.flatMap((english, i) => {
      const issue = validation.issues[i]
      // Hide issues belonging to a step the player hasn't reached yet.
      if (issue && STEPS.findIndex((s) => s.id === issueStepId(issue.code)) > stepIndex) {
        return []
      }
      // Localize from the engine's code + params; fall back to its English sentence.
      return [(issue && copy.issue(issue)) ?? english]
    })
    if (messages.length === 0) return null
    return (
      <div className="mt-4 flex flex-col gap-2">
        {messages.map((message, i) => (
          <ErrorBanner key={`${i}-${message}`} message={message} />
        ))}
      </div>
    )
  }

  const { character } = validation

  return (
    <div className="border-accent bg-accent-soft mt-4 flex flex-wrap items-center justify-between gap-3 rounded border px-4 py-3 font-mono text-[12px]">
      <div className="text-accent flex flex-wrap gap-4">
        <span>
          {terms.stats.MIGHT} <strong>{character.pools.might.max}</strong>
        </span>
        <span>
          {terms.stats.SPEED} <strong>{character.pools.speed.max}</strong>
        </span>
        <span>
          {terms.stats.INTELLECT} <strong>{character.pools.intellect.max}</strong>
        </span>
        <span>
          {copy.validation.edge(
            character.edge.might,
            character.edge.speed,
            character.edge.intellect,
          )}
        </span>
        <span>
          {copy.validation.effort} {character.effort}
        </span>
      </div>
      {validating && <span className="text-text-muted">{copy.validation.updating}</span>}
    </div>
  )
}
