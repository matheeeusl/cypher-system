import type { DescriptorPoolBonusChoice, Stat } from '@/lib/graphql/queries'

import { useWizardI18n } from './i18n'
import type { DescriptorPoolChoice, PoolAllocation } from './state'

interface DescriptorPoolChoicePickerProps {
  choice: DescriptorPoolBonusChoice
  value: DescriptorPoolChoice | null
  onChange: (value: DescriptorPoolChoice) => void
}

const POOL_KEY: Record<Stat, keyof PoolAllocation> = {
  MIGHT: 'might',
  SPEED: 'speed',
  INTELLECT: 'intellect',
}

/** " +2 Might", " −2 Speed": a signed bonus for display. */
export function signedAmount(amount: number): string {
  return amount < 0 ? `−${-amount}` : `+${amount}`
}

/**
 * The Pool bonus a Descriptor lets the player decide: steppers to divide the
 * points among the offered stats (Hideous, Sensational…), or radio buttons
 * for one of a few fixed options (Sylph, Rusted). `value` is null until the
 * player touches it; an answer of the other kind is ignored.
 */
export function DescriptorPoolChoicePicker({
  choice,
  value,
  onChange,
}: DescriptorPoolChoicePickerProps) {
  const { copy, terms } = useWizardI18n()
  const text = copy.descriptor.poolChoice

  return (
    <div className="border-accent bg-bg mb-4 rounded border px-4 py-3">
      <div className="text-accent mb-2 font-mono text-[11px] tracking-wide uppercase">
        {text.title}
      </div>
      {choice.__typename === 'DescriptorPoolDivide' ? (
        <DivideRows
          points={choice.points}
          stats={choice.stats}
          allocation={
            value && 'allocation' in value ? value.allocation : { might: 0, speed: 0, intellect: 0 }
          }
          onChange={(allocation) => onChange({ allocation })}
        />
      ) : (
        <fieldset>
          <legend className="text-text mb-2 text-[13px]">{text.oneOf}</legend>
          <div className="flex flex-col gap-1.5">
            {choice.options.map((option, index) => {
              const label = option
                .map((bonus) => `${signedAmount(bonus.amount)} ${terms.stats[bonus.stat]}`)
                .join(', ')
              const checked =
                value !== null && 'optionIndex' in value && value.optionIndex === index
              return (
                <label
                  key={label}
                  className={`flex cursor-pointer items-center gap-2.5 rounded border px-3 py-2 font-mono text-[13px] ${
                    checked ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text'
                  }`}
                >
                  <input
                    type="radio"
                    name="descriptor-pool-choice"
                    checked={checked}
                    onChange={() => onChange({ optionIndex: index })}
                    className="accent-accent"
                  />
                  {label}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
    </div>
  )
}

function DivideRows({
  points,
  stats,
  allocation,
  onChange,
}: {
  points: number
  stats: Stat[]
  allocation: PoolAllocation
  onChange: (allocation: PoolAllocation) => void
}) {
  const { copy, terms } = useWizardI18n()
  const text = copy.descriptor.poolChoice
  const remaining = points - stats.reduce((sum, stat) => sum + allocation[POOL_KEY[stat]], 0)

  function adjust(stat: Stat, delta: number) {
    const key = POOL_KEY[stat]
    onChange({ ...allocation, [key]: Math.max(0, allocation[key] + delta) })
  }

  return (
    <div>
      <p className="text-text mb-2 text-[13px]">{text.divide(points)}</p>
      <div
        className={`mb-1 flex items-center justify-between font-mono text-[12px] ${
          remaining === 0 ? 'text-accent' : 'text-warning'
        }`}
      >
        <span>{text.remaining}</span>
        <span className="font-semibold">{remaining}</span>
      </div>
      {stats.map((stat) => (
        <div
          key={stat}
          className="border-border flex items-center justify-between border-b py-2 last:border-b-0"
        >
          <span className="text-text text-[14px]">{terms.stats[stat]}</span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label={`${terms.stats[stat]} −1`}
              disabled={allocation[POOL_KEY[stat]] === 0}
              onClick={() => adjust(stat, -1)}
              className="border-border bg-panel text-text h-[30px] w-[30px] cursor-pointer rounded border text-base disabled:cursor-default disabled:opacity-40"
            >
              −
            </button>
            <span className="text-text w-6 text-center font-mono text-[15px]">
              {allocation[POOL_KEY[stat]]}
            </span>
            <button
              type="button"
              aria-label={`${terms.stats[stat]} +1`}
              disabled={remaining === 0}
              onClick={() => adjust(stat, 1)}
              className="border-border bg-panel text-text h-[30px] w-[30px] cursor-pointer rounded border text-base disabled:cursor-default disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
