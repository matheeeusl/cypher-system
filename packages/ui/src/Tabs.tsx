interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div role="tablist" className="border-border flex overflow-hidden rounded-md border">
      {items.map((item, i) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`flex-1 cursor-pointer px-2.5 py-2.5 font-mono text-xs transition-colors ${
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
