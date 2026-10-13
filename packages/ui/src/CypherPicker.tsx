'use client'

import { useState } from 'react'

export interface CypherPickerItem {
  id: string
  name: string
  categoryId: string
  categoryLabel: string
  level: string
  effect: string
}

export interface CypherPickerLabels {
  hint: string
  browse: string
  search: string
  shown: (count: number) => string
  close: string
  all: string
  noResults: string
  level: (level: string) => string
  add: string
  loading: string
  loadFailed: string
}

interface CypherPickerProps {
  /** null while the catalog is loading. */
  cyphers: CypherPickerItem[] | null
  categories: Array<{ id: string; label: string }>
  labels: CypherPickerLabels
  open: boolean
  failed?: boolean
  onOpen: () => void
  onClose: () => void
  onAdd: (id: string) => void
}

export function CypherPicker({
  cyphers,
  categories,
  labels,
  open,
  failed = false,
  onOpen,
  onClose,
  onAdd,
}: CypherPickerProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const rows = (cyphers ?? []).filter(
    (c) => c.name.toLowerCase().includes(q) && (category === 'ALL' || c.categoryId === category),
  )
  const selected = cyphers?.find((c) => c.id === selectedId) ?? null

  const pill = (active: boolean) =>
    `cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[11px] ${
      active
        ? 'border-accent bg-accent-soft text-accent'
        : 'border-border text-text-muted bg-transparent'
    }`

  return (
    <div className="border-border bg-panel mb-3 rounded-md border px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-text text-[13px]">{labels.hint}</span>
        {!open && (
          <button
            type="button"
            onClick={onOpen}
            className="border-accent bg-accent-soft text-accent shrink-0 cursor-pointer rounded border px-3 py-1.75 font-mono text-[11px] font-semibold hover:opacity-80"
          >
            {labels.browse}
          </button>
        )}
      </div>

      {open && (
        <div className="border-border mt-3.5 border-t pt-3.5">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedId(null)
              }}
              placeholder={labels.search}
              aria-label={labels.search}
              className="border-border bg-bg text-text placeholder:text-text-muted focus:border-accent min-w-45 flex-1 rounded border px-3 py-2 font-mono text-[13px] outline-none"
            />
            <span className="text-text-muted font-mono text-[11px] whitespace-nowrap">
              {labels.shown(rows.length)}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="border-border text-text-muted cursor-pointer rounded border px-2.5 py-1.5 font-mono text-[11px] hover:opacity-80"
            >
              {labels.close}
            </button>
          </div>

          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {[{ id: 'ALL', label: labels.all }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategory(c.id)
                  setSelectedId(null)
                }}
                className={pill(category === c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {failed ? (
            <p className="text-warning py-3 font-mono text-xs">{labels.loadFailed}</p>
          ) : cyphers === null ? (
            <p className="text-text-muted py-3 font-mono text-xs italic">{labels.loading}</p>
          ) : (
            <>
              <div className="grid max-h-55 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {rows.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded border px-2.5 py-1.75 text-left ${
                      selectedId === c.id ? 'border-accent bg-accent-soft' : 'border-border bg-bg'
                    }`}
                  >
                    <span className="text-text text-[13px]">{c.name}</span>
                    <span className="text-text-muted shrink-0 font-mono text-[10px]">
                      {c.categoryLabel}
                    </span>
                  </button>
                ))}
              </div>
              {rows.length === 0 && (
                <p className="text-text-muted py-3 font-mono text-xs italic">{labels.noResults}</p>
              )}
            </>
          )}

          {selected && (
            <div className="border-accent bg-accent-soft mt-3 rounded border px-4 py-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-display text-text text-[15px] font-semibold">
                    {selected.name}
                  </span>
                  <span className="text-text-muted ml-2 font-mono text-[11px]">
                    {selected.categoryLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(selected.id)
                    setSelectedId(null)
                  }}
                  className="bg-accent text-bg shrink-0 cursor-pointer rounded px-3.5 py-1.75 font-mono text-[11px] font-semibold hover:opacity-90"
                >
                  {labels.add}
                </button>
              </div>
              <p className="text-text-muted mb-1 font-mono text-xs">
                {labels.level(selected.level)}
              </p>
              <p className="text-text text-[13px] leading-relaxed">{selected.effect}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
