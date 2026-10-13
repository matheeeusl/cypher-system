import type { ValidationResult } from '@/lib/graphql/queries'

import { ErrorBanner } from './ErrorBanner'
import { useWizardI18n } from './i18n'

interface ValidationSummaryProps {
  validation: ValidationResult | null
  validating: boolean
}

export function ValidationSummary({ validation, validating }: ValidationSummaryProps) {
  const { copy, terms } = useWizardI18n()
  if (!validation) return null

  if (validation.__typename === 'InvalidCharacterResult') {
    return (
      <div className="mt-4 flex flex-col gap-2">
        {validation.errors.map((english, i) => {
          // Localize from the engine's code + params; fall back to its English sentence.
          const issue = validation.issues[i]
          const message = (issue && copy.issue(issue)) ?? english
          return <ErrorBanner key={`${i}-${message}`} message={message} />
        })}
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
