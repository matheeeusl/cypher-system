import type { StepId } from './state'

interface StepperNavProps {
  steps: Array<{ id: StepId; label: string }>
  currentIndex: number
  onJump: (index: number) => void
}

export function StepperNav({ steps, currentIndex, onJump }: StepperNavProps) {
  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        return (
          <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={`h-px flex-1 ${i === 0 ? 'bg-transparent' : i <= currentIndex ? 'bg-accent' : 'bg-border'}`}
              />
              <button
                type="button"
                onClick={() => onJump(i)}
                className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-[11px] ${
                  isCurrent
                    ? 'border-accent bg-accent-soft text-accent cursor-pointer'
                    : isDone
                      ? 'border-accent bg-accent text-bg cursor-pointer'
                      : 'border-border text-text-muted bg-transparent'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </button>
              <div
                className={`h-px flex-1 ${i === steps.length - 1 ? 'bg-transparent' : i < currentIndex ? 'bg-accent' : 'bg-border'}`}
              />
            </div>
            <span
              className={`mt-1.5 truncate font-mono text-[10px] tracking-wide uppercase ${
                isCurrent ? 'text-accent' : 'text-text-muted'
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
