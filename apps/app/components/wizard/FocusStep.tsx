import type { WizardFocus } from '@/lib/graphql/queries'

import { focusTier1GrantedIds } from './derive'
import { SearchableEntityList } from './SearchableEntityList'

interface FocusStepProps {
  foci: WizardFocus[] | null
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (id: string) => void
}

export function FocusStep({ foci, loading, error, selectedId, onSelect }: FocusStepProps) {
  if (loading) return <p className="text-text-muted text-sm">Loading Foci…</p>
  if (error) return <p className="text-warning text-sm">Couldn’t load Foci: {error}</p>
  if (!foci) return null

  const selected = foci.find((f) => f.id === selectedId)
  const grantedCount = selected ? focusTier1GrantedIds(selected).length : 0

  return (
    <div>
      <SearchableEntityList
        entities={foci}
        selectedId={selectedId}
        onSelect={onSelect}
        searchPlaceholder={`Search ${foci.length} foci…`}
      />

      {selected && (
        <div className="border-border bg-panel mt-5 rounded border p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-accent h-[7px] w-[7px] rounded-full" />
            <span className="text-accent font-mono text-[11px] tracking-wide uppercase">Focus</span>
          </div>
          <div className="font-display text-text mb-2.5 text-lg font-semibold">
            {selected.name.en}
          </div>
          <p className="text-text text-[14px] leading-relaxed">{selected.description.en}</p>
          {grantedCount > 0 && (
            <p className="text-text-muted mt-3 font-mono text-[12px]">
              Grants {grantedCount} tier-1 {grantedCount === 1 ? 'ability' : 'abilities'} — shown
              for you on the Abilities step.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
