export interface CharacterSheetData {
  name: string
  /** e.g. "Brash Warrior · Bears a Halo of Fire · Tier 1" */
  headline: string
  quickStats: Array<{ label: string; value: string }>
  pools: Array<{ name: string; edge: number; current: number; max: number }>
  skills: Array<{ name: string; level: string }>
  abilities: Array<{ name: string; meta: string; description: string }>
  inventory: Array<{ name: string; meta: string }>
  background: string
}

export interface CharacterSheetLabels {
  pools: string
  edge: string
  skills: string
  abilities: string
  inventory: string
  background: string
  printFooter: string
}

interface CharacterSheetProps {
  sheet: CharacterSheetData
  labels: CharacterSheetLabels
  /** Buttons shown beside the name (hidden when printing). */
  actions?: React.ReactNode
  /** Shown only on paper, bottom right (e.g. "Printed 13/10/2026"). */
  printDate?: string
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-text-muted mb-2.5 font-mono text-xs tracking-wider uppercase">
      {children}
    </h2>
  )
}

export function CharacterSheet({ sheet, labels, actions, printDate }: CharacterSheetProps) {
  return (
    <div className="border-border bg-panel rounded-md border px-9 py-8 print:rounded-none print:border-0 print:p-0">
      <div className="mb-1.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-text mb-1 text-[30px] font-semibold">{sheet.name}</h1>
          <p className="text-text-muted font-mono text-[13px]">{sheet.headline}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 print:hidden">{actions}</div>}
      </div>

      <div className="bg-border mt-4.5 mb-5.5 h-px" />

      <div className="mb-6 grid grid-cols-3 gap-3">
        {sheet.quickStats.map((stat) => (
          <div key={stat.label} className="border-border rounded border px-3.5 py-2.5">
            <div className="text-text-muted mb-1 font-mono text-[11px] tracking-wide uppercase">
              {stat.label}
            </div>
            <div className="text-text font-mono text-[15px] font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>

      <section className="mb-6.5">
        <SectionTitle>{labels.pools}</SectionTitle>
        <div className="border-border rounded border px-4">
          {sheet.pools.map((pool) => (
            <div
              key={pool.name}
              className="border-border flex items-center justify-between border-b py-2.5 last:border-b-0"
            >
              <span className="font-display text-text text-sm font-semibold">{pool.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-text-muted font-mono text-[13px]">
                  {labels.edge} {pool.edge}
                </span>
                <span className="text-text font-mono text-[15px] font-semibold">
                  {pool.current} / {pool.max}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {sheet.skills.length > 0 && (
        <section className="mb-6.5">
          <SectionTitle>{labels.skills}</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {sheet.skills.map((skill) => (
              <li
                key={skill.name}
                className="border-border text-text flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-xs"
              >
                <span>{skill.name}</span>
                <span className="text-accent text-[10px] uppercase">{skill.level}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6.5">
        <SectionTitle>{labels.abilities}</SectionTitle>
        <ul>
          {sheet.abilities.map((ability) => (
            <li key={ability.name} className="border-border border-b py-2.5">
              <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
                <span className="font-display text-text text-sm font-semibold">{ability.name}</span>
                {ability.meta && (
                  <span className="text-text-muted font-mono text-[11px]">{ability.meta}</span>
                )}
              </div>
              <p className="text-text-muted text-[13px] leading-relaxed">{ability.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {sheet.inventory.length > 0 && (
        <section className="mb-6.5">
          <SectionTitle>{labels.inventory}</SectionTitle>
          <ul>
            {sheet.inventory.map((item) => (
              <li
                key={`${item.name}${item.meta}`}
                className="border-border flex items-center justify-between gap-4 border-b py-1.75"
              >
                <span className="text-text text-sm">{item.name}</span>
                <span className="text-text-muted font-mono text-xs">{item.meta}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sheet.background && (
        <section>
          <SectionTitle>{labels.background}</SectionTitle>
          <p className="text-text text-sm leading-[1.7] whitespace-pre-line">{sheet.background}</p>
        </section>
      )}

      <div className="border-border text-text-muted mt-8 hidden justify-between border-t pt-3.5 font-mono text-[11px] print:flex">
        <span>{labels.printFooter}</span>
        <span>{printDate}</span>
      </div>
    </div>
  )
}
