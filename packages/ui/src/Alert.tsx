interface AlertProps {
  variant?: 'error' | 'warning' | 'success'
  title?: string | undefined
  children: React.ReactNode
}

export function Alert({ variant = 'error', title, children }: AlertProps) {
  const variants = {
    error: 'border-warning bg-warning-soft',
    warning: 'border-warning bg-warning-soft',
    success: 'border-accent bg-accent-soft',
  }

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded border px-4 py-3 ${variants[variant]}`}
    >
      {title && (
        <div
          className={`font-display mb-1.5 text-[15px] font-semibold ${
            variant === 'success' ? 'text-accent' : 'text-warning'
          }`}
        >
          {title}
        </div>
      )}
      <div className="text-text text-xs leading-relaxed">{children}</div>
    </div>
  )
}
