'use client'

import { useState } from 'react'

import type { LocalizedString } from '@/lib/graphql/queries'

import { useWizardI18n } from './i18n'

interface EntityLike {
  id: string
  name: LocalizedString
}

interface SearchableEntityListProps<T extends EntityLike> {
  entities: T[]
  selectedId: string | null
  onSelect: (id: string) => void
  searchPlaceholder: string
  getMeta?: (entity: T) => string
}

export function SearchableEntityList<T extends EntityLike>({
  entities,
  selectedId,
  onSelect,
  searchPlaceholder,
  getMeta,
}: SearchableEntityListProps<T>) {
  const { copy, t } = useWizardI18n()
  const [query, setQuery] = useState('')
  const filtered = entities.filter((entity) =>
    t(entity.name).toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="border-border bg-panel text-text flex-1 rounded border px-3 py-2 font-mono text-[13px] outline-none"
        />
        <span className="text-text-muted shrink-0 font-mono text-[12px]">
          {copy.search.shown(filtered.length)}
        </span>
      </div>

      <div className="grid max-h-[260px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {filtered.map((entity) => {
          const isSelected = selectedId === entity.id
          return (
            <button
              key={entity.id}
              type="button"
              onClick={() => onSelect(entity.id)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded border-[1.5px] px-3 py-2.5 text-left ${
                isSelected ? 'border-accent bg-accent-soft' : 'border-border bg-panel'
              }`}
            >
              <span className="text-text text-[14px] font-medium">{t(entity.name)}</span>
              {getMeta && (
                <span className="text-text-muted shrink-0 font-mono text-[11px]">
                  {getMeta(entity)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-text-muted py-4 font-mono text-[13px] italic">
          {copy.search.noResults}
        </div>
      )}
    </div>
  )
}
