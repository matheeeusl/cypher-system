interface BackgroundStepProps {
  name: string
  background: string
  onNameChange: (value: string) => void
  onBackgroundChange: (value: string) => void
}

export function BackgroundStep({
  name,
  background,
  onNameChange,
  onBackgroundChange,
}: BackgroundStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-text-muted mb-1.5 block font-mono text-[12px] tracking-wide uppercase">
          Character Name
        </label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Kessa Verne"
          className="border-border bg-panel text-text w-full rounded border px-3 py-2.5 text-[15px] outline-none"
        />
      </div>
      <div>
        <label className="text-text-muted mb-1.5 block font-mono text-[12px] tracking-wide uppercase">
          Background
        </label>
        <textarea
          value={background}
          onChange={(e) => onBackgroundChange(e.target.value)}
          placeholder="A few sentences on who this character is…"
          rows={5}
          className="border-border bg-panel text-text w-full resize-y rounded border px-3 py-2.5 text-[14px] leading-relaxed outline-none"
        />
      </div>
    </div>
  )
}
