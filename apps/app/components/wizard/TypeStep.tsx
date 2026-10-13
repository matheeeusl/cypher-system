import type { Stat, WizardType } from '@/lib/graphql/queries'

import { useWizardI18n } from './i18n'
import type { WizardChoices } from './state'

interface TypeStepProps {
  types: WizardType[] | null
  loading: boolean
  error: string | null
  choices: WizardChoices
  onSelectType: (id: string) => void
  onSelectEdgeChoice: (stat: Stat) => void
}

export function TypeStep({
  types,
  loading,
  error,
  choices,
  onSelectType,
  onSelectEdgeChoice,
}: TypeStepProps) {
  const { copy, terms, t } = useWizardI18n()
  if (loading) return <p className="text-text-muted text-sm">{copy.loading(copy.entities.types)}</p>
  if (error) {
    return <p className="text-warning text-sm">{copy.loadFailed(copy.entities.types, error)}</p>
  }
  if (!types) return null

  const selected = types.find((t) => t.id === choices.typeId)

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {types.map((type) => {
          const isSelected = choices.typeId === type.id
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelectType(type.id)}
              className={`rounded-[5px] border-[1.5px] px-4 py-3.5 text-left ${
                isSelected ? 'border-accent bg-accent-soft' : 'border-border bg-panel'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-display text-text text-[15px] font-semibold">
                  {t(type.name)}
                </span>
                {isSelected && <span className="text-accent font-mono text-xs">✓</span>}
              </div>
              <div className="text-text-muted text-[13px] leading-relaxed">{t(type.tagline)}</div>
            </button>
          )
        })}
      </div>

      {selected && selected.startingEdge.statChoices.length > 1 && (
        <div className="border-border bg-panel mt-5 rounded border p-4">
          <div className="text-text-muted mb-2 font-mono text-[11px] tracking-wide uppercase">
            {copy.type.startingEdge}
          </div>
          <div className="flex gap-2">
            {selected.startingEdge.statChoices.map((stat) => (
              <button
                key={stat}
                type="button"
                onClick={() => onSelectEdgeChoice(stat)}
                className={`rounded border px-3 py-1.5 font-mono text-[12px] ${
                  choices.startingEdgeChoice === stat
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-panel text-text-muted'
                }`}
              >
                {terms.stats[stat]} +{selected.startingEdge.amount}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
