interface AuthCardProps {
  eyebrow: string
  title: string
  children: React.ReactNode
}

export function AuthCard({ eyebrow, title, children }: AuthCardProps) {
  return (
    <div className="border-border bg-panel rounded-md border px-6.5 py-7">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="bg-accent size-1.75 rounded-full" />
        <span className="text-accent font-mono text-[11px] tracking-wider uppercase">
          {eyebrow}
        </span>
      </div>
      <h1 className="font-display text-text mb-5 text-[22px] font-semibold">{title}</h1>
      {children}
    </div>
  )
}
