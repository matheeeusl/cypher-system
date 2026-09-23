interface ErrorBannerProps {
  message: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="border-warning bg-warning/10 mt-4 flex items-center gap-3 rounded border px-4 py-3">
      <span className="text-warning font-mono text-[13px] font-semibold">!</span>
      <span className="text-text text-[13px]">{message}</span>
    </div>
  )
}
