import { useId } from 'react'

interface TextFieldProps {
  label: string
  name?: string
  type?: 'text' | 'email' | 'password'
  value?: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  autoComplete?: string
  onChange?: (value: string) => void
}

export function TextField({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  invalid = false,
  disabled = false,
  autoComplete,
  onChange,
}: TextFieldProps) {
  const id = useId()

  return (
    <div>
      <label
        htmlFor={id}
        className="text-text-muted mb-1.5 block font-mono text-[11px] tracking-wide uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={`bg-panel text-text placeholder:text-text-muted focus:border-accent w-full rounded border px-3 py-2.5 font-sans text-sm transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
          invalid ? 'border-warning' : 'border-border'
        }`}
      />
    </div>
  )
}
