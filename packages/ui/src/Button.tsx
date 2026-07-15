interface ButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  const base = 'rounded px-4 py-2 font-medium transition-colors cursor-pointer'
  const variants = {
    primary: 'bg-[--color-accent] text-[--color-bg] hover:opacity-90',
    ghost: 'border border-[--color-border] text-[--color-text] hover:bg-[--color-panel]',
  }

  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick}>
      {label}
    </button>
  )
}
