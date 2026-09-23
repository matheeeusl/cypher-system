import type { ValidationResult } from '@/lib/graphql/queries'

import { ErrorBanner } from './ErrorBanner'

interface ValidationSummaryProps {
  validation: ValidationResult | null
  validating: boolean
}

export function ValidationSummary({ validation, validating }: ValidationSummaryProps) {
  if (!validation) return null

  if (validation.__typename === 'InvalidCharacterResult') {
    return (
      <div className="mt-4 flex flex-col gap-2">
        {validation.errors.map((message) => (
          <ErrorBanner key={message} message={message} />
        ))}
      </div>
    )
  }

  const { character } = validation

  return (
    <div className="border-accent bg-accent-soft mt-4 flex flex-wrap items-center justify-between gap-3 rounded border px-4 py-3 font-mono text-[12px]">
      <div className="text-accent flex flex-wrap gap-4">
        <span>
          Might <strong>{character.pools.might.max}</strong>
        </span>
        <span>
          Speed <strong>{character.pools.speed.max}</strong>
        </span>
        <span>
          Intellect <strong>{character.pools.intellect.max}</strong>
        </span>
        <span>
          Edge M{character.edge.might}/S{character.edge.speed}/I{character.edge.intellect}
        </span>
        <span>Effort {character.effort}</span>
      </div>
      {validating && <span className="text-text-muted">updating…</span>}
    </div>
  )
}
