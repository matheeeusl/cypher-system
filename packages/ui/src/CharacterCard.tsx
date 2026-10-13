export interface CharacterSummary {
  id: string
  name: string
  tier: number
  descriptor: string
  type: string
  focus: string
  /** Pre-formatted, already localized (e.g. "Updated 2 days ago"). */
  updatedLabel: string
  /** The character was built against an older version of the rules. */
  stale?: boolean
  href: string
}

interface CharacterCardProps {
  character: CharacterSummary
  tierLabel: string
  updateBadge: string
  /** When set, a delete button is shown beside the card. */
  deleteLabel?: string
  onDelete?: (id: string) => void
}

export function CharacterCard({
  character: c,
  tierLabel,
  updateBadge,
  deleteLabel,
  onDelete,
}: CharacterCardProps) {
  return (
    <div className="border-border bg-panel hover:border-accent flex items-stretch overflow-hidden rounded-md border transition-colors">
      <a
        href={c.href}
        className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center justify-between gap-4 px-5 py-4"
      >
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2.5">
            <span className="font-display text-text text-[17px] font-semibold">{c.name}</span>
            <span className="border-border text-text-muted rounded-sm border px-1.75 py-px font-mono text-[11px]">
              {tierLabel} {c.tier}
            </span>
            {c.stale && (
              <span className="border-warning bg-warning-soft text-warning rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase">
                {updateBadge}
              </span>
            )}
          </div>
          <div className="text-text-muted font-mono text-[13px]">
            {c.descriptor} {c.type} · {c.focus}
          </div>
        </div>
        <div className="text-text-muted shrink-0 font-mono text-xs">{c.updatedLabel}</div>
      </a>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(c.id)}
          className="border-border text-text-muted hover:text-warning cursor-pointer border-l px-4 font-mono text-xs transition-colors"
        >
          {deleteLabel}
        </button>
      )}
    </div>
  )
}
