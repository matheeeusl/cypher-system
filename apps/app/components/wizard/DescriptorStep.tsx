import type { Stat, WizardDescriptor } from '@/lib/graphql/queries'

import { SearchableEntityList } from './SearchableEntityList'

const STAT_LABELS: Record<Stat, string> = { MIGHT: 'Might', SPEED: 'Speed', INTELLECT: 'Intellect' }

interface DescriptorStepProps {
  descriptors: WizardDescriptor[] | null
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (id: string) => void
}

export function DescriptorStep({
  descriptors,
  loading,
  error,
  selectedId,
  onSelect,
}: DescriptorStepProps) {
  if (loading) return <p className="text-text-muted text-sm">Loading Descriptors…</p>
  if (error) return <p className="text-warning text-sm">Couldn’t load Descriptors: {error}</p>
  if (!descriptors) return null

  const selected = descriptors.find((d) => d.id === selectedId)

  return (
    <div>
      <SearchableEntityList
        entities={descriptors}
        selectedId={selectedId}
        onSelect={onSelect}
        searchPlaceholder={`Search ${descriptors.length} descriptors…`}
      />

      {selected && (
        <div className="border-border bg-panel mt-5 rounded border p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-accent h-[7px] w-[7px] rounded-full" />
            <span className="text-accent font-mono text-[11px] tracking-wide uppercase">
              Descriptor
            </span>
          </div>
          <div className="font-display text-text mb-2.5 text-lg font-semibold">
            {selected.name.en}
          </div>
          <p className="text-text mb-4 text-[14px] leading-relaxed">{selected.description.en}</p>

          {selected.poolBonus.length > 0 && (
            <div className="text-accent mb-4 font-mono text-[12px]">
              Pool bonus:{' '}
              {selected.poolBonus
                .map((bonus) => `+${bonus.amount} ${STAT_LABELS[bonus.stat]}`)
                .join(', ')}
            </div>
          )}

          {selected.characteristics.length > 0 && (
            <div className="border-border bg-bg mb-4 rounded border px-4">
              {selected.characteristics.map((c) => (
                <div
                  key={c.name.en}
                  className="border-border flex justify-between gap-4 border-b py-2 last:border-b-0"
                >
                  <span className="text-text-muted font-mono text-[12px] tracking-wide uppercase">
                    {c.name.en}
                  </span>
                  <span className="text-text text-right text-[12px]">{c.description.en}</span>
                </div>
              ))}
            </div>
          )}

          {selected.connectionOptions.length > 0 && (
            <div>
              <div className="text-text-muted mb-2 font-mono text-[11px] tracking-wide uppercase">
                Initial Link to the Starting Adventure
              </div>
              <div className="flex flex-col gap-2">
                {selected.connectionOptions.map((option) => (
                  <div
                    key={option.en}
                    className="text-text-muted flex gap-2 text-[13px] leading-relaxed"
                  >
                    <span className="text-accent shrink-0">·</span>
                    <span>{option.en}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
