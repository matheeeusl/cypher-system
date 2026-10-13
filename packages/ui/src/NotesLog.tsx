'use client'

import { useEffect, useRef, useState } from 'react'

import { Alert } from './Alert'
import { Pagination } from './Pagination'

export interface NotesLogEntry {
  id: number
  body: string
  /** Already formatted, e.g. "Oct 13, 2026, 7:42 PM". */
  dateLabel: string
}

export interface NotesLogLabels {
  title: string
  placeholder: string
  add: string
  empty: string
  remove: string
  previous: string
  next: string
  /** "Page 2 of 5" */
  page: (current: number, total: number) => string
  /** "120 / 500" */
  count: (used: number, max: number) => string
}

interface NotesLogProps {
  entries: NotesLogEntry[]
  labels: NotesLogLabels
  onAdd: (body: string) => void
  onRemove: (id: number) => void
  /** Longest note, in characters. */
  maxLength: number
  errorMessage?: string | undefined
  /** Notes per page (default 5; shown in the order given). */
  pageSize?: number | undefined
}

export function NotesLog({
  entries,
  labels,
  onAdd,
  onRemove,
  maxLength,
  errorMessage,
  pageSize = 5,
}: NotesLogProps) {
  const [body, setBody] = useState('')
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const shown = entries.slice(current * pageSize, (current + 1) * pageSize)

  // A new note goes back to the first page, where the newest one is shown.
  const previousCount = useRef(entries.length)
  useEffect(() => {
    if (entries.length > previousCount.current) setPage(0)
    previousCount.current = entries.length
  }, [entries.length])

  const trimmed = body.trim()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!trimmed) return
    onAdd(trimmed)
    setBody('')
  }

  return (
    <section>
      <h2 className="text-text-muted mb-2.5 font-mono text-xs tracking-wider uppercase">
        {labels.title}
      </h2>

      <form onSubmit={submit} className="mb-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          maxLength={maxLength}
          rows={3}
          className="border-border bg-panel text-text placeholder:text-text-muted focus:border-accent w-full resize-y rounded border px-3.5 py-3 text-[13px] leading-relaxed outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span
            className={`font-mono text-[11px] ${body.length >= maxLength ? 'text-warning' : 'text-text-muted'}`}
          >
            {labels.count(body.length, maxLength)}
          </span>
          <button
            type="submit"
            disabled={!trimmed}
            className="bg-accent text-bg rounded px-3.5 py-2 font-mono text-xs font-semibold enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {labels.add}
          </button>
        </div>
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
              className="border-border bg-panel flex items-start justify-between gap-3 rounded border px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-text-muted mb-1 font-mono text-[11px]">{entry.dateLabel}</p>
                <p className="text-text text-[13px] leading-relaxed break-words whitespace-pre-line">
                  {entry.body}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                aria-label={labels.remove}
                className="text-text-muted hover:text-warning shrink-0 cursor-pointer px-1 text-sm"
              >
                ×
              </button>
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
