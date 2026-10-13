'use client'

import { useState } from 'react'

export interface PoolSplitOption {
  id: string
  label: string
}

interface PoolSplitPickerProps {
  /** Short prompt ("Split +4 points among your Pools:"). */
  title: string
  /** Points to hand out; the confirm button stays disabled until all are used. */
  total: number
  options: PoolSplitOption[]
  /** `remaining` text, e.g. (n) => `${n} left`. */
  remainingLabel: (remaining: number) => string
  confirmLabel: string
  cancelLabel: string
  addLabel: string
  removeLabel: string
  onConfirm: (allocation: Record<string, number>) => void
  onCancel: () => void
}

/** Splits a fixed number of points across several Pools with +/- steppers. */
export function PoolSplitPicker({
  title,
  total,
  options,
  remainingLabel,
  confirmLabel,
  cancelLabel,
  addLabel,
  removeLabel,
  onConfirm,
  onCancel,
}: PoolSplitPickerProps) {
  const [alloc, setAlloc] = useState<Record<string, number>>({})
  const used = options.reduce((sum, o) => sum + (alloc[o.id] ?? 0), 0)
  const remaining = total - used

  function change(id: string, delta: number) {
    setAlloc((a) => ({ ...a, [id]: Math.max(0, (a[id] ?? 0) + delta) }))
  }

  const stepper =
    'border-border bg-panel text-text flex h-7 w-7 items-center justify-center rounded border font-mono text-sm enabled:cursor-pointer enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="border-border mt-3 border-t pt-3">
      <p className="text-text-muted mb-2.5 font-mono text-[11px]">
        {title} <span className="text-accent">{remainingLabel(remaining)}</span>
      </p>
      <ul className="mb-3 flex flex-col gap-2">
        {options.map((o) => (
          <li key={o.id} className="flex items-center gap-3">
            <span className="text-text w-28 font-mono text-xs">{o.label}</span>
            <button
              type="button"
              className={stepper}
              aria-label={`${removeLabel} ${o.label}`}
              disabled={(alloc[o.id] ?? 0) === 0}
              onClick={() => change(o.id, -1)}
            >
              −
            </button>
            <span className="text-text w-6 text-center font-mono text-sm" aria-live="polite">
              +{alloc[o.id] ?? 0}
            </span>
            <button
              type="button"
              className={stepper}
              aria-label={`${addLabel} ${o.label}`}
              disabled={remaining === 0}
              onClick={() => change(o.id, 1)}
            >
              +
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={remaining !== 0}
          onClick={() =>
            onConfirm(Object.fromEntries(options.map((o) => [o.id, alloc[o.id] ?? 0])))
          }
          className="bg-accent text-bg rounded px-3 py-1.5 font-mono text-xs enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-text-muted hover:text-text cursor-pointer font-mono text-[11px]"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}
