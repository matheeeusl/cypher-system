'use client'

import { useState } from 'react'

interface PoolMeterProps {
  name: string
  edgeLabel: string
  edge: number
  current: number
  max: number
  spendLabel: string
  recoverLabel: string
  recoverFullLabel: string
  /** Accessible name of the amount field, e.g. "Amount". */
  amountLabel: string
  confirmLabel: string
  cancelLabel: string
  onSpend: (amount: number) => void
  onRecover: (amount: number | 'all') => void
}

function MeterButton({
  children,
  onClick,
  tone = 'neutral',
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'neutral' | 'accent'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded border px-3 py-1.5 font-mono text-[11px] transition-opacity hover:opacity-80 ${
        tone === 'accent'
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-border bg-panel text-text'
      }`}
    >
      {children}
    </button>
  )
}

export function PoolMeter({
  name,
  edgeLabel,
  edge,
  current,
  max,
  spendLabel,
  recoverLabel,
  recoverFullLabel,
  amountLabel,
  confirmLabel,
  cancelLabel,
  onSpend,
  onRecover,
}: PoolMeterProps) {
  const [mode, setMode] = useState<'spend' | 'recover' | null>(null)
  const [amount, setAmount] = useState('1')
  const empty = current === 0

  function open(next: 'spend' | 'recover') {
    setMode(mode === next ? null : next)
    setAmount('1')
  }

  const parsed = Number(amount)
  const valid = Number.isInteger(parsed) && parsed >= 1

  function submit() {
    if (!mode || !valid) return
    if (mode === 'spend') onSpend(parsed)
    else onRecover(parsed)
    setMode(null)
  }
  const pct = max > 0 ? Math.round((current / max) * 100) : 0

  return (
    <div className="border-border bg-panel rounded-md border px-4.5 py-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-text text-sm font-semibold">
          {name}{' '}
          <span className="text-text-muted font-mono text-[11px] font-normal">
            {edgeLabel} {edge}
          </span>
        </span>
        <span
          className={`font-mono text-[15px] font-semibold ${empty ? 'text-warning' : 'text-text'}`}
        >
          {current} / {max}
        </span>
      </div>
      <div
        role="meter"
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current}
        className="bg-bg mb-2.5 h-2 overflow-hidden rounded"
      >
        <div
          className={`h-full transition-[width] duration-150 ${empty ? 'bg-warning' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MeterButton onClick={() => open('spend')}>{spendLabel} X</MeterButton>
        <div className="flex-1" />
        <MeterButton tone="accent" onClick={() => open('recover')}>
          {recoverLabel} X
        </MeterButton>
        <MeterButton tone="accent" onClick={() => onRecover('all')}>
          {recoverFullLabel}
        </MeterButton>
      </div>
      {mode && (
        <form
          className="mt-2.5 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMode(null)
          }}
        >
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label={`${mode === 'spend' ? spendLabel : recoverLabel} — ${amountLabel}`}
            className="border-border bg-bg text-text focus:border-accent w-20 rounded border px-2 py-1.5 font-mono text-xs outline-none"
          />
          <button
            type="submit"
            disabled={!valid}
            className="bg-accent text-bg rounded px-3 py-1.5 font-mono text-[11px] enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => setMode(null)}
            className="text-text-muted hover:text-text cursor-pointer font-mono text-[11px]"
          >
            {cancelLabel}
          </button>
        </form>
      )}
    </div>
  )
}
