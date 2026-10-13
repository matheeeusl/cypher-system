interface NotesFieldProps {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  /** Small status text beside the label ("Saving…", "Saved"). */
  status?: string | undefined
}

export function NotesField({ label, value, placeholder, onChange, status }: NotesFieldProps) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-text-muted font-mono text-xs tracking-wider uppercase">{label}</span>
        {status && <span className="text-text-muted font-mono text-[11px]">{status}</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        rows={5}
        className="border-border bg-panel text-text placeholder:text-text-muted focus:border-accent w-full resize-y rounded border px-3.5 py-3 text-[13px] leading-relaxed outline-none"
      />
    </div>
  )
}
