interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  /** `segmented` fills the width as one bar; `pills` are separate rounded chips. */
  variant?: 'segmented' | 'pills'
}

export function Tabs({ items, value, onChange, variant = 'segmented' }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div role="tablist" className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.75 font-mono text-xs transition-colors ${
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border text-text-muted hover:text-text bg-transparent'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div role="tablist" className="border-border flex overflow-x-auto rounded-md border">
      {items.map((item, i) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`flex-1 shrink-0 cursor-pointer px-3.5 py-2.5 font-mono text-xs whitespace-nowrap transition-colors ${
              i > 0 ? 'border-border border-l' : ''
            } ${active ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text bg-transparent'}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
