'use client'

import { useEffect, useRef, useState } from 'react'

import { Alert } from './Alert'
import { Pagination } from './Pagination'

export interface XpLogEntry {
  id: number
  reason: string
  /** e.g. "+3 XP" / "−4 XP" */
  amountLabel: string
  tone: 'gain' | 'spend'
  removable: boolean
}

export interface XpLogLabels {
  title: string
  reasonPlaceholder: string
  gain: string
  spend: string
  add: string
  empty: string
  remove: string
  previous: string
  next: string
  /** "Page 2 of 5" */
  page: (current: number, total: number) => string
}

interface XpLogProps {
  entries: XpLogEntry[]
  labels: XpLogLabels
  onAdd: (entry: { kind: 'gain' | 'spend'; amount: number; reason: string }) => void
  onRemove: (id: number) => void
  errorMessage?: string | undefined
  /** Entries per page (default 5; the list is shown in the order given). */
  pageSize?: number | undefined
}

export function XpLog({
  entries,
  labels,
  onAdd,
  onRemove,
  errorMessage,
  pageSize = 5,
}: XpLogProps) {
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('1')
  const [kind, setKind] = useState<'gain' | 'spend'>('gain')
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const shown = entries.slice(current * pageSize, (current + 1) * pageSize)

  // A new entry goes back to the first page, where the newest one is shown.
  const previousCount = useRef(entries.length)
  useEffect(() => {
    if (entries.length > previousCount.current) setPage(0)
    previousCount.current = entries.length
  }, [entries.length])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = reason.trim()
    if (!trimmed) return
    onAdd({ kind, amount: Math.max(1, Math.floor(Number(amount)) || 1), reason: trimmed })
    setReason('')
    setAmount('1')
  }

  return (
    <section>
      <h2 className="text-text-muted mb-2.5 font-mono text-xs tracking-wider uppercase">
        {labels.title}
      </h2>

      <form onSubmit={submit} className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={labels.reasonPlaceholder}
          aria-label={labels.reasonPlaceholder}
          maxLength={200}
          className="border-border bg-panel text-text placeholder:text-text-muted focus:border-accent min-w-50 flex-1 rounded border px-3 py-2 text-[13px] outline-none"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          min={1}
          max={1000}
          aria-label="XP"
          className="border-border bg-panel text-text focus:border-accent w-16 rounded border px-2.5 py-2 font-mono text-[13px] outline-none"
        />
        <div className="border-border flex overflow-hidden rounded border">
          {(['gain', 'spend'] as const).map((k, i) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`cursor-pointer px-2.5 py-2 font-mono text-[11px] ${i > 0 ? 'border-border border-l' : ''} ${
                kind === k
                  ? k === 'gain'
                    ? 'bg-accent-soft text-accent'
                    : 'bg-warning-soft text-warning'
                  : 'text-text-muted bg-transparent'
              }`}
            >
              {labels[k]}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="bg-accent text-bg cursor-pointer rounded px-3.5 py-2 font-mono text-xs font-semibold hover:opacity-90"
        >
          {labels.add}
        </button>
      </form>

      {errorMessage && (
        <div className="mb-3">
          <Alert variant="error">{errorMessage}</Alert>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="border-border text-text-muted rounded border border-dashed p-4 text-center font-mono text-xs italic">
          {labels.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {shown.map((entry) => (
            <li
              key={entry.id}
              className="border-border bg-panel flex items-center justify-between gap-3 rounded border px-3.5 py-2"
            >
              <span className="text-text text-[13px]">{entry.reason}</span>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`font-mono text-[13px] font-semibold ${
                    entry.tone === 'gain' ? 'text-accent' : 'text-warning'
                  }`}
                >
                  {entry.amountLabel}
                </span>
                {entry.removable ? (
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    aria-label={labels.remove}
                    className="text-text-muted hover:text-warning cursor-pointer px-1 text-sm"
                  >
                    ×
                  </button>
                ) : (
                  <span className="w-3.5" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={current}
        pageCount={pageCount}
        ariaLabel={labels.title}
        labels={labels}
        onChange={setPage}
      />
    </section>
  )
}
