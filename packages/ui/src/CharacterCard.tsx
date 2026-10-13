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
}

export function CharacterCard({ character: c, tierLabel, updateBadge }: CharacterCardProps) {
  return (
    <a
      href={c.href}
      className="border-border bg-panel hover:border-accent flex cursor-pointer flex-wrap items-center justify-between gap-4 rounded-md border px-5 py-4 transition-colors"
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
  )
}
