'use client'

import { useState } from 'react'

export interface AbilityPickOption {
  id: string
  label: string
  description?: string
  /** Small tag, e.g. the tier the ability comes from. */
  meta?: string
}

interface AbilityPickerProps {
  title: string
  /** Shown under the title, e.g. "Choose 2 — 1 selected". */
  hint: (selected: number, required: number) => string
  /** How many options must be ticked before confirming. */
  required: number
  options: AbilityPickOption[]
  confirmLabel: string
  /** Disables the confirm button while a save is running. */
  busy?: boolean | undefined
  onConfirm: (ids: string[]) => void
}

/** A checklist of abilities where exactly `required` must be ticked. */
export function AbilityPicker({
  title,
  hint,
  required,
  options,
  confirmLabel,
  busy,
  onConfirm,
}: AbilityPickerProps) {
  const [selected, setSelected] = useState<string[]>([])
  const full = selected.length >= required

  function toggle(id: string) {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < required ? [...cur, id] : cur,
    )
  }

  return (
    <section className="border-accent bg-accent-soft rounded-md border px-4.5 py-3.5">
      <h3 className="font-display text-text mb-0.5 text-sm font-semibold">{title}</h3>
      <p className="text-text-muted mb-3 font-mono text-[11px]" aria-live="polite">
        {hint(selected.length, required)}
      </p>
      <ul className="mb-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
        {options.map((o) => {
          const on = selected.includes(o.id)
          return (
            <li key={o.id}>
              <label
                className={`flex gap-2.5 rounded border px-3 py-2 ${
                  on ? 'border-accent bg-panel' : 'border-border bg-panel'
                } ${!on && full ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={!on && full}
                  onChange={() => toggle(o.id)}
                  className="accent-accent mt-0.5"
                />
                <span className="flex-1">
                  <span className="text-text font-mono text-xs font-semibold">{o.label}</span>
                  {o.meta && (
                    <span className="text-text-muted ml-2 font-mono text-[10px]">{o.meta}</span>
                  )}
                  {o.description && (
                    <span className="text-text-muted mt-0.5 line-clamp-2 block text-xs">
                      {o.description}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        disabled={selected.length !== required || busy === true}
        onClick={() => onConfirm(selected)}
        className="bg-accent text-bg rounded px-3 py-1.5 font-mono text-xs enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {confirmLabel}
      </button>
    </section>
  )
}
