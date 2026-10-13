interface ButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
}

export function Button({
  label,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const base =
    'rounded px-4 py-2 font-mono transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-accent text-bg text-[13px] font-semibold hover:opacity-90',
    ghost: 'border border-border bg-panel text-text-muted text-[11px] hover:opacity-90',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
