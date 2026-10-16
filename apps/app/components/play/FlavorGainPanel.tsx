'use client'

import { useState } from 'react'

import { Button } from '@cypher/ui'

import type { playCopy } from '@/lib/i18n/play'
import type { FlavorGainView } from '@/lib/play-view'

type Copy = (typeof playCopy)['en']
type Swap = { tier: number; replaces: string; with: string }

interface FlavorGainPanelProps {
  gain: FlavorGainView
  copy: Copy
  /** XP the character has right now. */
  xpTotal: number
  busy: boolean
  errorMessage?: string | undefined
  onGain: (flavorId: string, swaps: Swap[], free: boolean) => Promise<boolean>
  onUndo: () => void
}

/** A row being edited: `give` is `<tier>:<ability id>` of the pick, `take` an ability id. */
interface Row {
  give: string
  take: string
}

const selectClass =
  'border-border bg-panel text-text w-full rounded border px-2 py-1.5 font-mono text-xs'

/** Gain a flavor in play (4 XP, or free when a character arc granted it) and exchange Type picks for its abilities. */
export function FlavorGainPanel({
  gain,
  copy,
  xpTotal,
  busy,
  errorMessage,
  onGain,
  onUndo,
}: FlavorGainPanelProps) {
  const text = copy.flavorGain
  const [open, setOpen] = useState(false)
  const [flavorId, setFlavorId] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [free, setFree] = useState(false)

  const shell = (children: React.ReactNode, title: string) => (
    <section aria-label={title} className="border-border bg-panel rounded-md border px-4.5 py-3.5">
      <h2 className="font-display text-text mb-0.5 text-sm font-semibold">{title}</h2>
      {children}
      {errorMessage && (
        <p role="alert" className="text-warning mt-2 font-mono text-xs">
          {errorMessage}
        </p>
      )}
    </section>
  )

  if (gain.gained) {
    const { gained } = gain
    return shell(
      <>
        <ul className="my-2 flex flex-col gap-1.5">
          {gained.swaps.length === 0 && (
            <li className="text-text-muted font-mono text-[11px]">{text.noExchanges}</li>
          )}
          {gained.swaps.map((swap) => (
            <li
              key={`${swap.tier}:${swap.replaces}`}
              className="border-border text-text rounded border px-3 py-2 font-mono text-xs"
            >
              {text.swap(swap.replaces, swap.with, swap.tier)}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={onUndo}
          className="text-text-muted cursor-pointer font-mono text-[11px] underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {text.undo(gained.paidXp)}
        </button>
      </>,
      text.gainedTitle(gained.name),
    )
  }

  const offer = gain.offer
  if (!offer) return null

  const flavor = offer.flavors.find((f) => f.id === flavorId) ?? null
  const picks = offer.picks
  const pickKey = (p: { tier: number; id: string }) => `${p.tier}:${p.id}`
  const tierOfKey = (key: string) => Number(key.split(':')[0])
  const canAfford = xpTotal >= gain.costXp
  const complete = rows.every((r) => r.give !== '' && r.take !== '')
  const ready = flavor !== null && complete && (free || canAfford)

  const reset = () => {
    setOpen(false)
    setFlavorId(null)
    setRows([])
    setFree(false)
  }
  const setRow = (index: number, patch: Partial<Row>) =>
    setRows((cur) => cur.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  async function confirm() {
    if (!flavor || !ready) return
    const swaps: Swap[] = rows.map((r) => {
      const [tier, ...rest] = r.give.split(':')
      return { tier: Number(tier), replaces: rest.join(':'), with: r.take }
    })
    if (await onGain(flavor.id, swaps, free)) reset()
  }

  if (!open) {
    return shell(
      <>
        <p className="text-text-muted mb-1.5 font-mono text-[11px]">
          {text.description(gain.costXp)}
        </p>
        <p className="text-warning mb-3 font-mono text-[11px]">{text.disclaimer}</p>
        <Button label={text.open} disabled={busy} onClick={() => setOpen(true)} />
      </>,
      text.title,
    )
  }

  return shell(
    <>
      <p className="text-warning mb-3 font-mono text-[11px]">{text.disclaimer}</p>

      <h3 className="text-text-muted mb-1.5 font-mono text-[11px] tracking-wider uppercase">
        {text.choose}
      </h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {offer.flavors.map((f) => {
          const on = f.id === flavorId
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setFlavorId(f.id)
                // The old exchanges named abilities of another flavor.
                setRows((cur) => cur.map((r) => ({ ...r, take: '' })))
              }}
              className={`cursor-pointer rounded border px-3 py-1.5 font-mono text-[12px] ${
                on
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border bg-panel text-text-muted'
              }`}
            >
              {f.name}
            </button>
          )
        })}
      </div>
      {flavor && flavor.description && (
        <p className="text-text-muted mb-4 line-clamp-4 text-xs">{flavor.description}</p>
      )}

      {flavor && (
        <div className="mb-4">
          <h3 className="text-text-muted mb-1 font-mono text-[11px] tracking-wider uppercase">
            {text.exchanges}
          </h3>
          <p className="text-text-muted mb-2 font-mono text-[11px]">{text.exchangesHint}</p>
          {picks.length === 0 && (
            <p className="text-text-muted font-mono text-[11px]">{text.nothingToExchange}</p>
          )}
          <ul className="flex flex-col gap-2">
            {rows.map((row, index) => {
              const usedGive = new Set(rows.filter((_, i) => i !== index).map((r) => r.give))
              const usedTake = new Set(rows.filter((_, i) => i !== index).map((r) => r.take))
              const maxTier = row.give ? tierOfKey(row.give) : 0
              return (
                <li
                  key={index}
                  className="border-border grid gap-2 rounded border p-2.5 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <select
                    aria-label={`${text.giveUp} ${index + 1}`}
                    className={selectClass}
                    value={row.give}
                    onChange={(e) => {
                      const give = e.target.value
                      const tier = give ? tierOfKey(give) : 0
                      // The ability taken must be of the pick's tier or lower.
                      const stillOk = flavor.abilities.some(
                        (a) => a.id === row.take && a.tier <= tier,
                      )
                      setRow(index, { give, take: stillOk ? row.take : '' })
                    }}
                  >
                    <option value="">{text.pickOne}</option>
                    {picks
                      .filter((p) => !usedGive.has(pickKey(p)))
                      .map((p) => (
                        <option key={pickKey(p)} value={pickKey(p)}>
                          {p.name} · {text.tier(p.tier)}
                        </option>
                      ))}
                  </select>
                  <select
                    aria-label={`${text.take} ${index + 1}`}
                    className={selectClass}
                    value={row.take}
                    disabled={!row.give}
                    onChange={(e) => setRow(index, { take: e.target.value })}
                  >
                    <option value="">{text.pickOne}</option>
                    {flavor.abilities
                      .filter((a) => a.tier <= maxTier && !usedTake.has(a.id))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} · {text.tier(a.tier)}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setRows((cur) => cur.filter((_, i) => i !== index))}
                    className="text-text-muted cursor-pointer font-mono text-[11px] underline"
                  >
                    {text.removeExchange}
                  </button>
                </li>
              )
            })}
          </ul>
          {rows.length < picks.length && (
            <div className="mt-2">
              <Button
                label={text.addExchange}
                variant="ghost"
                onClick={() => setRows((cur) => [...cur, { give: '', take: '' }])}
              />
            </div>
          )}
        </div>
      )}

      <label className="text-text mb-3 flex cursor-pointer items-center gap-2 font-mono text-xs">
        <input
          type="checkbox"
          checked={free}
          onChange={(e) => setFree(e.target.checked)}
          className="accent-accent"
        />
        {text.free}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          label={text.confirm(gain.costXp, free)}
          disabled={!ready || busy}
          onClick={() => void confirm()}
        />
        <Button label={copy.advancement.cancel} variant="ghost" onClick={reset} />
        {!free && !canAfford && (
          <span className="text-text-muted font-mono text-[11px]">{text.needs(gain.costXp)}</span>
        )}
      </div>
    </>,
    text.title,
  )
}
