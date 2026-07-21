interface ButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  const base = 'rounded px-4 py-2 font-mono transition-colors cursor-pointer'
  const variants = {
    primary: 'bg-accent text-bg text-[13px] font-semibold hover:opacity-90',
    ghost: 'border border-border bg-panel text-text-muted text-[11px] hover:opacity-90',
  }

  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick}>
      {label}
    </button>
  )
}
