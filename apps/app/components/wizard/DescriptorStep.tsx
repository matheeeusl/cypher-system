import type { WizardDescriptor } from '@/lib/graphql/queries'

import { DescriptorPoolChoicePicker, signedAmount } from './DescriptorPoolChoicePicker'
import { useWizardI18n } from './i18n'
import { SearchableEntityList } from './SearchableEntityList'
import type { DescriptorPoolChoice } from './state'

interface DescriptorStepProps {
  descriptors: WizardDescriptor[] | null
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (id: string) => void
  poolChoice: DescriptorPoolChoice | null
  onPoolChoiceChange: (value: DescriptorPoolChoice) => void
}

export function DescriptorStep({
  descriptors,
  loading,
  error,
  selectedId,
  onSelect,
  poolChoice,
  onPoolChoiceChange,
}: DescriptorStepProps) {
  const { copy, terms, t } = useWizardI18n()
  if (loading) {
    return <p className="text-text-muted text-sm">{copy.loading(copy.entities.descriptors)}</p>
  }
  if (error) {
    return (
      <p className="text-warning text-sm">{copy.loadFailed(copy.entities.descriptors, error)}</p>
    )
  }
  if (!descriptors) return null

  const selected = descriptors.find((d) => d.id === selectedId)
  // The book's order: Standard first, then each genre group (by the page it
  // starts on), alphabetical inside a group in the current language.
  const sorted = [...descriptors].sort(
    (a, b) => a.category.page - b.category.page || t(a.name).localeCompare(t(b.name)),
  )

  return (
    <div>
      <SearchableEntityList
        entities={sorted}
        selectedId={selectedId}
        onSelect={onSelect}
        searchPlaceholder={copy.search.descriptors(descriptors.length)}
        // "Catfolk — Fantasy Species": the genre shows (and is searchable) on
        // genre descriptors; Standard ones show nothing.
        getMeta={(d) => (d.category.id === 'standard' ? '' : t(d.category.name))}
      />

      {selected && (
        <div className="border-border bg-panel mt-5 rounded border p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-accent h-[7px] w-[7px] rounded-full" />
            <span className="text-accent font-mono text-[11px] tracking-wide uppercase">
              {copy.descriptor.tag}
            </span>
          </div>
          <div className="font-display text-text mb-2.5 text-lg font-semibold">
            {t(selected.name)}
          </div>
          <p className="text-text mb-4 text-[14px] leading-relaxed">{t(selected.description)}</p>

          {selected.poolBonus.length > 0 && (
            <div className="text-accent mb-4 font-mono text-[12px]">
              {copy.descriptor.poolBonus}{' '}
              {selected.poolBonus
                .map((bonus) => `${signedAmount(bonus.amount)} ${terms.stats[bonus.stat]}`)
                .join(', ')}
            </div>
          )}

          {selected.poolBonusChoice && (
            <DescriptorPoolChoicePicker
              choice={selected.poolBonusChoice}
              value={poolChoice}
              onChange={onPoolChoiceChange}
            />
          )}

          {selected.characteristics.length > 0 && (
            <div className="border-border bg-bg mb-4 rounded border px-4">
              {selected.characteristics.map((c) => (
                <div
                  key={c.name.en}
                  className="border-border flex justify-between gap-4 border-b py-2 last:border-b-0"
                >
                  <span className="text-text-muted font-mono text-[12px] tracking-wide uppercase">
                    {t(c.name)}
                  </span>
                  <span className="text-text text-right text-[12px]">{t(c.description)}</span>
                </div>
              ))}
            </div>
          )}

          {selected.connectionOptions.length > 0 && (
            <div>
              <div className="text-text-muted mb-2 font-mono text-[11px] tracking-wide uppercase">
                {copy.descriptor.startingLink}
              </div>
              <div className="flex flex-col gap-2">
                {selected.connectionOptions.map((option) => (
                  <div
                    key={option.en}
                    className="text-text-muted flex gap-2 text-[13px] leading-relaxed"
                  >
                    <span className="text-accent shrink-0">·</span>
                    <span>{t(option)}</span>
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
