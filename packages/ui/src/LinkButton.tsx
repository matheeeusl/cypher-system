interface LinkButtonProps {
  href: string
  label: string
  size?: 'md' | 'lg'
}

export function LinkButton({ href, label, size = 'md' }: LinkButtonProps) {
  const sizes = {
    md: 'px-4.5 py-2.5',
    lg: 'px-5.5 py-2.75',
  }

  return (
    <a
      href={href}
      className={`bg-accent text-bg inline-block shrink-0 cursor-pointer rounded font-mono text-[13px] font-semibold transition-opacity hover:opacity-90 ${sizes[size]}`}
    >
      {label}
    </a>
  )
}
