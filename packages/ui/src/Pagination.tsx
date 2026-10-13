'use client'

export interface PaginationLabels {
  previous: string
  next: string
  /** "Page 2 of 5" */
  page: (current: number, total: number) => string
}

interface PaginationProps {
  /** Zero-based current page. */
  page: number
  pageCount: number
  labels: PaginationLabels
  onChange: (page: number) => void
  /** Names the navigation landmark. */
  ariaLabel: string
}

/** Previous / next with a "Page 2 of 5" indicator; renders nothing for a single page. */
export function Pagination({ page, pageCount, labels, onChange, ariaLabel }: PaginationProps) {
  if (pageCount <= 1) return null
  const button =
    'border-border text-text rounded border px-3 py-1.5 enabled:cursor-pointer enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-3 flex items-center justify-between font-mono text-[11px]"
    >
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className={button}
      >
        {labels.previous}
      </button>
      <span className="text-text-muted" aria-live="polite">
        {labels.page(page + 1, pageCount)}
      </span>
      <button
        type="button"
        disabled={page >= pageCount - 1}
        onClick={() => onChange(page + 1)}
        className={button}
      >
        {labels.next}
      </button>
    </nav>
  )
}
