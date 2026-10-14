import { DocsLink } from '@/components/DocsLink'
import { docsLinks } from '@/lib/docs-links'
import type { WizardFocus } from '@/lib/graphql/queries'

import { focusTier1GrantedIds } from './derive'
import { useWizardI18n } from './i18n'
import { SearchableEntityList } from './SearchableEntityList'

interface FocusStepProps {
  foci: WizardFocus[] | null
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (id: string) => void
}

export function FocusStep({ foci, loading, error, selectedId, onSelect }: FocusStepProps) {
  const { copy, t, locale } = useWizardI18n()
  if (loading) return <p className="text-text-muted text-sm">{copy.loading(copy.entities.foci)}</p>
  if (error) {
    return <p className="text-warning text-sm">{copy.loadFailed(copy.entities.foci, error)}</p>
  }
  if (!foci) return null

  const selected = foci.find((f) => f.id === selectedId)
  const grantedCount = selected ? focusTier1GrantedIds(selected).length : 0

  return (
    <div>
      <SearchableEntityList
        entities={foci}
        selectedId={selectedId}
        onSelect={onSelect}
        searchPlaceholder={copy.search.foci(foci.length)}
      />

      {selected && (
        <div className="border-border bg-panel mt-5 rounded border p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-accent h-[7px] w-[7px] rounded-full" />
            <span className="text-accent font-mono text-[11px] tracking-wide uppercase">
              {copy.focus.tag}
            </span>
          </div>
          <div className="font-display text-text mb-2.5 text-lg font-semibold">
            {t(selected.name)}
          </div>
          <p className="text-text text-[14px] leading-relaxed">{t(selected.description)}</p>
          {grantedCount > 0 && (
            <p className="text-text-muted mt-3 font-mono text-[12px]">
              {copy.focus.grants(grantedCount)}
            </p>
          )}
          <div className="mt-3">
            <DocsLink href={docsLinks.entity(locale, 'foci', selected.id)} />
          </div>
        </div>
      )}
    </div>
  )
}
