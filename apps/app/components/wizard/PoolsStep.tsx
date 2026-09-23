import type { WizardType } from '@/lib/graphql/queries'

import { POOL_POINTS_TOTAL, type PoolAllocation } from './state'

interface PoolsStepProps {
  type: WizardType | undefined
  allocation: PoolAllocation
  onChange: (allocation: PoolAllocation) => void
}

const POOLS: Array<{ key: keyof PoolAllocation; label: string }> = [
  { key: 'might', label: 'Might' },
  { key: 'speed', label: 'Speed' },
  { key: 'intellect', label: 'Intellect' },
]

export function PoolsStep({ type, allocation, onChange }: PoolsStepProps) {
  if (!type) return <p className="text-text-muted text-sm">Choose a Type first.</p>

  const spent = allocation.might + allocation.speed + allocation.intellect
  const remaining = POOL_POINTS_TOTAL - spent
  const ok = remaining === 0

  function adjust(key: keyof PoolAllocation, delta: number) {
    onChange({ ...allocation, [key]: Math.max(0, allocation[key] + delta) })
  }

  return (
    <div>
      <div
        className={`mb-5 flex items-center justify-between rounded border px-4 py-2.5 font-mono text-[13px] ${
          ok
            ? 'border-accent bg-accent-soft text-accent'
            : 'border-warning bg-warning/10 text-warning'
        }`}
      >
        <span>Points remaining</span>
        <span className="text-base font-semibold">{remaining}</span>
      </div>

      {POOLS.map(({ key, label }) => {
        const base = type.startingPools[key]
        return (
          <div
            key={key}
            className="border-border flex items-center justify-between border-b py-3.5 last:border-b-0"
          >
            <div>
              <div className="font-display text-text text-[15px] font-semibold">{label}</div>
              <div className="text-text-muted font-mono text-[12px]">
                {base} base + {allocation[key]} = {base + allocation[key]}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => adjust(key, -1)}
                className="border-border bg-panel text-text h-[30px] w-[30px] rounded border text-base"
              >
                −
              </button>
              <span className="text-text w-6 text-center font-mono text-[15px]">
                {allocation[key]}
              </span>
              <button
                type="button"
                onClick={() => adjust(key, 1)}
                className="border-border bg-panel text-text h-[30px] w-[30px] rounded border text-base"
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
