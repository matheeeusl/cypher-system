'use client'

import { useState } from 'react'

export interface ChipOption {
  id: string
  label: string
  /** Already at the maximum / can't be picked. */
  disabled?: boolean
  /** Visually emphasised (e.g. a skill the character already has). */
  highlight?: boolean
}

interface ChipPickerProps {
  /** Short prompt shown before the chips ("Add +4 to:"). */
  title?: string
  options: ChipOption[]
  onPick: (id: string) => void
  onCancel?: () => void
  cancelLabel?: string
  /** When set, shows a filter box above the chips and filters by label. */
  searchPlaceholder?: string
  /**
   * An extra choice built from what's typed in the filter box (e.g. "use this
   * name as a new skill"), shown first. Return null for none.
   */
  extraOption?: ((query: string) => ChipOption | null) | undefined
}

/** A row of choices, optionally filterable — used for the advancement pickers. */
export function ChipPicker({
  title,
  options,
  onPick,
  onCancel,
  cancelLabel,
  searchPlaceholder,
  extraOption,
}: ChipPickerProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = searchPlaceholder
    ? options.filter((o) => o.label.toLowerCase().includes(q))
    : options
  const extra = searchPlaceholder && extraOption ? extraOption(query) : null
  const shown = extra ? [extra, ...filtered] : filtered

  return (
    <div className="border-border mt-3 border-t pt-3">
      {searchPlaceholder && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="border-border bg-panel text-text placeholder:text-text-muted focus:border-accent mb-2.5 w-full rounded border px-3 py-2 font-mono text-xs outline-none"
        />
      )}
      <div
        className={`flex flex-wrap items-center gap-2 ${
          searchPlaceholder ? 'max-h-55 overflow-y-auto pr-1' : ''
        }`}
      >
        {title && <span className="text-text-muted font-mono text-[11px]">{title}</span>}
        {shown.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={o.disabled}
            onClick={() => onPick(o.id)}
            className={`rounded border px-3 py-1.5 font-mono text-xs transition-colors ${
              o.disabled
                ? 'border-border bg-panel text-text-muted cursor-not-allowed'
                : o.highlight
                  ? 'border-border bg-accent-soft text-accent cursor-pointer hover:opacity-80'
                  : 'border-border bg-panel text-text cursor-pointer hover:opacity-80'
            }`}
          >
            {o.label}
          </button>
        ))}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-text-muted hover:text-text ml-auto cursor-pointer font-mono text-[11px]"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  )
}
