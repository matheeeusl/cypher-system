import { useState } from 'react'

import { toCustomSkill } from '@/lib/custom-skill'

import { useWizardI18n } from './i18n'

/** A text field for a skill/area the player types themselves (see `allowCustom`). */
export function CustomSkillInput({
  disabled,
  onAdd,
}: {
  disabled: boolean
  onAdd: (id: string) => void
}) {
  const { copy } = useWizardI18n()
  const [text, setText] = useState('')
  const id = toCustomSkill(text)

  function add() {
    if (id === null || disabled) return
    onAdd(id)
    setText('')
  }

  return (
    <div className="mt-3 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
        }}
        placeholder={copy.abilities.customPlaceholder}
        className="border-border bg-panel text-text min-w-0 flex-1 rounded border px-3 py-1.5 text-[12px] outline-none"
      />
      <button
        type="button"
        disabled={id === null || disabled}
        onClick={add}
        className="border-accent text-accent rounded border px-3 py-1.5 font-mono text-[12px] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copy.abilities.customAdd}
      </button>
    </div>
  )
}
