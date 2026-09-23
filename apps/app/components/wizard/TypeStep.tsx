import type { Stat, WizardType } from '@/lib/graphql/queries'

import type { WizardChoices } from './state'

interface TypeStepProps {
  types: WizardType[] | null
  loading: boolean
  error: string | null
  choices: WizardChoices
  onSelectType: (id: string) => void
  onSelectEdgeChoice: (stat: Stat) => void
}

const STAT_LABELS: Record<Stat, string> = { MIGHT: 'Might', SPEED: 'Speed', INTELLECT: 'Intellect' }

export function TypeStep({
  types,
  loading,
  error,
  choices,
  onSelectType,
  onSelectEdgeChoice,
}: TypeStepProps) {
  if (loading) return <p className="text-text-muted text-sm">Loading Types…</p>
  if (error) return <p className="text-warning text-sm">Couldn’t load Types: {error}</p>
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
                  {type.name.en}
                </span>
                {isSelected && <span className="text-accent font-mono text-xs">✓</span>}
              </div>
              <div className="text-text-muted text-[13px] leading-relaxed">{type.tagline.en}</div>
            </button>
          )
        })}
      </div>

      {selected && selected.startingEdge.statChoices.length > 1 && (
        <div className="border-border bg-panel mt-5 rounded border p-4">
          <div className="text-text-muted mb-2 font-mono text-[11px] tracking-wide uppercase">
            Starting Edge — choose one
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
                {STAT_LABELS[stat]} +{selected.startingEdge.amount}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
