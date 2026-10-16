import type { StepId } from './state'

interface StepperNavProps {
  steps: Array<{ id: StepId; label: string }>
  currentIndex: number
  /** Steps after this index are locked until the earlier ones are complete. */
  reachableIndex: number
  onJump: (index: number) => void
}

export function StepperNav({ steps, currentIndex, reachableIndex, onJump }: StepperNavProps) {
  return (
    // Every step is an equal-width column (`flex-1`), so the circles sit at
    // even intervals and each label is centred under its circle. The thin
    // connector is drawn as two half-lines inside each column, one on each
    // side of the circle; the first and last columns hide their outer half.
    <div className="flex items-start">
      {steps.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        const isLocked = i > reachableIndex
        return (
          <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={`h-px flex-1 ${i === 0 ? 'bg-transparent' : i <= currentIndex ? 'bg-accent' : 'bg-border'}`}
              />
              <button
                type="button"
                onClick={() => onJump(i)}
                disabled={isLocked}
                aria-label={step.label}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex h-[26px] w-[26px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] font-mono text-[11px] disabled:cursor-not-allowed disabled:opacity-50 ${
                  isCurrent
                    ? 'border-accent bg-accent-soft text-accent'
                    : isDone
                      ? 'border-accent bg-accent text-bg'
                      : 'border-border text-text-muted bg-transparent'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </button>
              <div
                className={`h-px flex-1 ${i === steps.length - 1 ? 'bg-transparent' : i < currentIndex ? 'bg-accent' : 'bg-border'}`}
              />
            </div>
            {/* Labels only from `sm` up: nine labels don't fit a phone width. */}
            <span
              className={`mt-1.5 hidden max-w-full truncate px-0.5 font-mono text-[10px] tracking-wide uppercase sm:block ${
                isCurrent ? 'text-accent' : 'text-text-muted'
              } ${isLocked ? 'opacity-50' : ''}`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
