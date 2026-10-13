'use client'

import { useState } from 'react'

import { Alert } from './Alert'

export interface InventoryRow {
  id: string
  name: string
  meta: string
  qty: number
}

export interface InventoryLabels {
  title: string
  itemName: string
  itemMeta: string
  add: string
  decrease: string
  increase: string
  remove: string
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
}

export function InventoryList({
  items,
  labels,
  header,
  onAdd,
  onChangeQty,
  onRemove,
  errorMessage,
}: InventoryListProps) {
  const [name, setName] = useState('')
  const [meta, setMeta] = useState('')

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
          className="border-border bg-panel text-text placeholder:text-text-muted focus:border-accent min-w-40 flex-1 rounded border px-3 py-2 text-[13px] outline-none"
        />
        <input
          value={meta}
          onChange={(e) => setMeta(e.target.value)}
          placeholder={labels.itemMeta}
          aria-label={labels.itemMeta}
          maxLength={80}
          className="border-border bg-panel text-text placeholder:text-text-muted focus:border-accent min-w-40 flex-1 rounded border px-3 py-2 font-mono text-xs outline-none"
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
        {items.map((item) => (
          <li
            key={item.id}
            className="border-border bg-panel flex items-center justify-between gap-3 rounded border px-3.5 py-2"
          >
            <div className="min-w-0">
              <span className="text-text text-[13px]">{item.name}</span>
              <span className="text-text-muted ml-2 font-mono text-[11px]">{item.meta}</span>
            </div>
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
          </li>
        ))}
      </ul>
    </section>
  )
}
