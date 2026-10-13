interface ConditionBannerProps {
  label: string
  note: string
  /** `ok` is the neutral healthy look; `warning` is any damage-track state. */
  tone?: 'ok' | 'warning'
  /** Small outlined tags, e.g. "Tier 2", "Effort 2". */
  chips?: string[]
}

export function ConditionBanner({ label, note, tone = 'ok', chips = [] }: ConditionBannerProps) {
  const warning = tone === 'warning'

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-md border px-4.5 py-3.5 ${
        warning ? 'border-warning bg-warning-soft' : 'border-border bg-panel'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className={`size-2 rounded-full ${warning ? 'bg-warning' : 'bg-accent'}`} />
        <span
          className={`font-display text-[15px] font-semibold ${warning ? 'text-warning' : 'text-accent'}`}
        >
          {label}
        </span>
        {chips.map((chip) => (
          <span
            key={chip}
            className="border-border text-text-muted rounded-sm border px-1.75 py-px font-mono text-[11px]"
          >
            {chip}
          </span>
        ))}
      </div>
      <span className="text-text-muted max-w-120 text-xs leading-relaxed">{note}</span>
    </div>
  )
}
