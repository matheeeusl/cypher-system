'use client'

import { useState } from 'react'

export interface AbilityPickOption {
  id: string
  label: string
  description?: string
  /** Small tag, e.g. the tier the ability comes from. */
  meta?: string
}

export interface AbilityPickerCustom {
  /** Placeholder of the text field. */
  placeholder: string
  addLabel: string
  /** Turns typed text into an option id, or null to refuse it (empty, too long…). */
  toId: (text: string) => string | null
  /** Label shown for an id this field produced. */
  labelOf: (id: string) => string
}

interface AbilityPickerProps {
  title: string
  /** Shown under the title, e.g. "Choose 2 — 1 selected". */
  hint: (selected: number, required: number) => string
  /** How many options must be ticked before confirming. */
  required: number
  /**
   * Other selection sizes that can be confirmed too (an ability that takes
   * "two skills, or one specialized"). `required` stays the headline count.
   */
  alsoAccept?: number[] | undefined
  options: AbilityPickOption[]
  /** A text field to add choices that aren't among `options` (the player's own). */
  custom?: AbilityPickerCustom | undefined
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
  alsoAccept,
  options,
  custom,
  confirmLabel,
  busy,
  onConfirm,
}: AbilityPickerProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [typed, setTyped] = useState('')
  const accepted = [required, ...(alsoAccept ?? [])]
  const max = Math.max(...accepted)
  const full = selected.length >= max

  function toggle(id: string) {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < max ? [...cur, id] : cur,
    )
  }

  const typedId = custom ? custom.toId(typed) : null
  const canAdd = typedId !== null && !selected.includes(typedId) && !full
  function addTyped() {
    if (typedId === null || !canAdd) return
    setSelected((cur) => [...cur, typedId])
    setTyped('')
  }
  // Ids that came from the text field, shown as their own (always ticked) rows.
  const optionIds = new Set(options.map((o) => o.id))
  const typedPicks = selected.filter((id) => !optionIds.has(id))

  return (
    <section className="border-accent bg-accent-soft rounded-md border px-4.5 py-3.5">
      <h3 className="font-display text-text mb-0.5 text-sm font-semibold">{title}</h3>
      <p className="text-text-muted mb-3 font-mono text-[11px]" aria-live="polite">
        {hint(selected.length, required)}
      </p>
      <ul className="mb-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
        {typedPicks.map((id) => (
          <li key={id}>
            <label className="border-accent bg-panel flex cursor-pointer gap-2.5 rounded border px-3 py-2">
              <input
                type="checkbox"
                checked
                onChange={() => toggle(id)}
                className="accent-accent mt-0.5"
              />
              <span className="text-text font-mono text-xs font-semibold">
                {custom ? custom.labelOf(id) : id}
              </span>
            </label>
          </li>
        ))}
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
      {custom && (
        <div className="mb-3 flex gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTyped()
              }
            }}
            placeholder={custom.placeholder}
            className="border-border bg-panel text-text min-w-0 flex-1 rounded border px-3 py-1.5 text-xs outline-none"
          />
          <button
            type="button"
            disabled={!canAdd}
            onClick={addTyped}
            className="border-accent text-accent rounded border px-3 py-1.5 font-mono text-xs enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {custom.addLabel}
          </button>
        </div>
      )}
      <button
        type="button"
        disabled={!accepted.includes(selected.length) || busy === true}
        onClick={() => onConfirm(selected)}
        className="bg-accent text-bg rounded px-3 py-1.5 font-mono text-xs enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {confirmLabel}
      </button>
    </section>
  )
}
