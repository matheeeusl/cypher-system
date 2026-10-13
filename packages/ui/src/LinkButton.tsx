interface LinkButtonProps {
  href: string
  label: string
  size?: 'md' | 'lg'
  variant?: 'primary' | 'ghost'
}

export function LinkButton({ href, label, size = 'md', variant = 'primary' }: LinkButtonProps) {
  const sizes = {
    md: 'px-4.5 py-2.5',
    lg: 'px-5.5 py-2.75',
  }

  const variants = {
    primary: 'bg-accent text-bg text-[13px] font-semibold',
    ghost: 'border-border bg-panel text-text-muted border text-[11px]',
  }

  return (
    <a
      href={href}
      className={`inline-block shrink-0 cursor-pointer rounded font-mono transition-opacity hover:opacity-90 ${variants[variant]} ${sizes[size]}`}
    >
      {label}
    </a>
  )
}
