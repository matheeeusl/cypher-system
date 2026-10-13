import { Alert } from './Alert'

export interface AdvancementStep {
  key: string
  label: string
  status: 'purchased' | 'available' | 'locked'
  statusLabel: string
  /** Shown on the buy button when status is `available`. */
  actionLabel?: string
}

interface AdvancementPanelProps {
  title: string
  summary: string
  description: string
  steps: AdvancementStep[]
  onBuy: (key: string) => void
  /** Rendered under the steps while a purchase needs a choice (pool/edge/skill picker). */
  picker?: React.ReactNode
  /** Explains why the remaining step(s) can't be bought right now. */
  notice?: string | undefined
  /** Confirmation after a tier-up. */
  tierUpMessage?: string | undefined
  dismissLabel?: string
  onDismissTierUp?: () => void
  errorMessage?: string | undefined
}

export function AdvancementPanel({
  title,
  summary,
  description,
  steps,
  onBuy,
  picker,
  notice,
  tierUpMessage,
  dismissLabel,
  onDismissTierUp,
  errorMessage,
}: AdvancementPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {tierUpMessage && (
        <div className="border-accent bg-accent-soft flex flex-wrap items-center justify-between gap-3 rounded-md border px-4.5 py-4">
          <span className="font-display text-accent text-[15px] font-semibold">
            {tierUpMessage}
          </span>
          {onDismissTierUp && (
            <button
              type="button"
              onClick={onDismissTierUp}
              className="border-accent text-accent cursor-pointer rounded border bg-transparent px-3 py-1.5 font-mono text-[11px] hover:opacity-80"
            >
              {dismissLabel}
            </button>
          )}
        </div>
      )}

      <section className="border-border bg-panel rounded-md border px-5 py-4.5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-text text-[15px] font-semibold">{title}</h2>
          <span className="text-text-muted font-mono text-xs">{summary}</span>
        </div>
        <p className="text-text-muted mb-3.5 text-xs">{description}</p>

        <ul className="flex flex-col gap-2">
          {steps.map((step) => (
            <li
              key={step.key}
              className="border-border flex flex-wrap items-center justify-between gap-3 rounded border px-3.5 py-2.5"
            >
              <span className="text-text text-[13px]">{step.label}</span>
              <div className="flex items-center gap-2.5">
                <span
                  className={`font-mono text-[11px] ${
                    step.status === 'purchased'
                      ? 'text-accent'
                      : step.status === 'available'
                        ? 'text-text'
                        : 'text-text-muted'
                  }`}
                >
                  {step.statusLabel}
                </span>
                {step.status === 'available' && (
                  <button
                    type="button"
                    onClick={() => onBuy(step.key)}
                    className="bg-accent text-bg cursor-pointer rounded px-3 py-1.5 font-mono text-[11px] font-semibold hover:opacity-90"
                  >
                    {step.actionLabel}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {picker}
        {notice && <p className="text-text-muted mt-3 text-xs leading-relaxed">{notice}</p>}
        {errorMessage && (
          <div className="mt-3">
            <Alert variant="error">{errorMessage}</Alert>
          </div>
        )}
      </section>
    </div>
  )
}
