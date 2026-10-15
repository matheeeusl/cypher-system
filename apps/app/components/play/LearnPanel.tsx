'use client'

import { useState } from 'react'

import { AbilityPicker, Button } from '@cypher/ui'

import type { playCopy } from '@/lib/i18n/play'
import type { LearnView } from '@/lib/play-view'

type Copy = (typeof playCopy)['en']

interface LearnPanelProps {
  learn: LearnView
  copy: Copy
  /** XP the character has right now. */
  xpTotal: number
  busy: boolean
  errorMessage?: string | undefined
  onLearn: (optionIds: string[]) => Promise<boolean>
  onUndo: (purchase: number) => void
}

/** Buy more options of a choice ability for XP (Cantrips: 2 XP for two more). */
export function LearnPanel({
  learn,
  copy,
  xpTotal,
  busy,
  errorMessage,
  onLearn,
  onUndo,
}: LearnPanelProps) {
  const [open, setOpen] = useState(false)
  const canAfford = xpTotal >= learn.costXp
  const hasOptions = learn.options.length >= learn.count

  return (
    <section
      aria-label={copy.learn.title(learn.abilityName)}
      className="border-border bg-panel rounded-md border px-4.5 py-3.5"
    >
      <h2 className="font-display text-text mb-0.5 text-sm font-semibold">
        {copy.learn.title(learn.abilityName)}
      </h2>
      <p className="text-text-muted mb-3 font-mono text-[11px]">
        {copy.learn.description(learn.costXp, learn.count)}
      </p>

      {learn.purchases.length > 0 && (
        <div className="mb-3">
          <h3 className="text-text-muted mb-1.5 font-mono text-[11px] tracking-wider uppercase">
            {copy.learn.learned}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {learn.purchases.map((p) => (
              <li
                key={p.index}
                className="border-border flex items-center justify-between gap-3 rounded border px-3 py-2"
              >
                <span className="text-text font-mono text-xs">{p.names.join(', ')}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onUndo(p.index)}
                  className="text-text-muted cursor-pointer font-mono text-[11px] underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copy.learn.undo}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open ? (
        <div className="flex flex-col gap-2">
          <AbilityPicker
            title={copy.learn.title(learn.abilityName)}
            hint={copy.picks.hint}
            required={learn.count}
            options={learn.options}
            confirmLabel={copy.learn.action(learn.costXp)}
            busy={busy}
            onConfirm={(ids) =>
              void onLearn(ids).then((ok) => {
                if (ok) setOpen(false)
              })
            }
          />
          <div>
            <Button
              label={copy.advancement.cancel}
              variant="ghost"
              onClick={() => setOpen(false)}
            />
          </div>
        </div>
      ) : !hasOptions ? (
        <p className="text-text-muted font-mono text-[11px]">{copy.learn.none}</p>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            label={copy.learn.action(learn.costXp)}
            disabled={!canAfford || busy}
            onClick={() => setOpen(true)}
          />
          {!canAfford && (
            <span className="text-text-muted font-mono text-[11px]">
              {copy.learn.needs(learn.costXp)}
            </span>
          )}
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="text-warning mt-2 font-mono text-xs">
          {errorMessage}
        </p>
      )}
    </section>
  )
}
