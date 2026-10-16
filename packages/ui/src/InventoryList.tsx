'use client'

import { useState } from 'react'

import { Alert } from './Alert'
import { Pagination } from './Pagination'

export interface InventoryRow {
  id: string
  name: string
  meta: string
  qty: number
  /** Shown when the row is clicked (a cypher's effect…). Omit for no details. */
  description?: string | undefined
}

export interface InventoryLabels {
  title: string
  itemName: string
  itemMeta: string
  add: string
  decrease: string
  increase: string
  remove: string
  previous: string
  next: string
  page: (current: number, total: number) => string
}

interface InventoryListProps {
  items: InventoryRow[]
  labels: InventoryLabels
  /** Rendered between the title and the add-item form (the cypher catalog, counters…). */
  header?: React.ReactNode
  onAdd: (item: { name: string; meta: string }) => void
  onChangeQty: (id: string, delta: 1 | -1) => void
  onRemove: (id: string) => void
  errorMessage?: string | undefined
  /** Rows per page. */
  pageSize?: number | undefined
}

export function InventoryList({
  items,
  labels,
  header,
  onAdd,
  onChangeQty,
  onRemove,
  errorMessage,
  pageSize = 5,
}: InventoryListProps) {
  const [name, setName] = useState('')
  const [meta, setMeta] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  // Removing the last row of the last page must not leave an empty page.
  const current = Math.min(page, pageCount - 1)
  const shown = items.slice(current * pageSize, (current + 1) * pageSize)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), meta: meta.trim() })
    setName('')
    setMeta('')
  }

  const qtyButton =
    'border-border bg-panel text-text size-6 cursor-pointer rounded border text-sm hover:opacity-80'

  return (
    <section>
      <h2 className="text-text-muted mb-2.5 font-mono text-xs tracking-wider uppercase">
        {labels.title}
      </h2>
      {header}

      <form onSubmit={submit} className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.itemName}
          aria-label={labels.itemName}
          maxLength={80}
          className="border-border bg-panel text-text placeholder:text-text-muted focus:border-accent w-full min-w-0 flex-1 rounded border px-3 py-2 text-[13px] outline-none sm:w-auto sm:min-w-40"
        />
        <input
          value={meta}
          onChange={(e) => setMeta(e.target.value)}
          placeholder={labels.itemMeta}
          aria-label={labels.itemMeta}
          maxLength={80}
          className="border-border bg-panel text-text placeholder:text-text-muted focus:border-accent w-full min-w-0 flex-1 rounded border px-3 py-2 font-mono text-xs outline-none sm:w-auto sm:min-w-40"
        />
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

      <ul className="flex flex-col gap-1.5">
        {shown.map((item) => {
          const open = openId === item.id && item.description !== undefined
          return (
            <li key={item.id} className="border-border bg-panel rounded border">
              <div className="flex items-center justify-between gap-3 px-3.5 py-2">
                {item.description !== undefined ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="min-w-0 flex-1 cursor-pointer text-left hover:opacity-80"
                  >
                    <span className="text-text text-[13px]">{item.name}</span>
                    <span className="text-text-muted ml-2 font-mono text-[11px]">{item.meta}</span>
                  </button>
                ) : (
                  <div className="min-w-0">
                    <span className="text-text text-[13px]">{item.name}</span>
                    <span className="text-text-muted ml-2 font-mono text-[11px]">{item.meta}</span>
                  </div>
                )}
                <div className="flex shrink-0 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onChangeQty(item.id, -1)}
                    aria-label={labels.decrease}
                    className={qtyButton}
                  >
                    −
                  </button>
                  <span className="w-4.5 text-center font-mono text-[13px]">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => onChangeQty(item.id, 1)}
                    aria-label={labels.increase}
                    className={qtyButton}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={labels.remove}
                    className="text-text-muted hover:text-warning cursor-pointer px-1 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
              {open && (
                <p className="border-border text-text-muted border-t px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <Pagination
        page={current}
        pageCount={pageCount}
        ariaLabel={labels.title}
        labels={{ previous: labels.previous, next: labels.next, page: labels.page }}
        onChange={setPage}
      />
    </section>
  )
}
