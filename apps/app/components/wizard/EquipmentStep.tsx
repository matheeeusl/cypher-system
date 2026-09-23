import type { PriceTier, WizardType } from '@/lib/graphql/queries'

const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  INEXPENSIVE: 'Inexpensive',
  MODERATELY_PRICED: 'Moderately priced',
  EXPENSIVE: 'Expensive',
  VERY_EXPENSIVE: 'Very expensive',
  EXORBITANT: 'Exorbitant',
  PRICELESS: 'Priceless',
}

interface EquipmentStepProps {
  type: WizardType | undefined
}

export function EquipmentStep({ type }: EquipmentStepProps) {
  if (!type) return <p className="text-text-muted text-sm">Choose a Type first.</p>

  const { startingEquipment } = type

  return (
    <div>
      <p className="text-text-muted mb-4 text-[13px] leading-relaxed">
        Starting equipment is fixed by your Type — there’s nothing to choose here.
      </p>

      <div className="flex flex-col gap-3">
        <div className="border-border bg-panel rounded border px-4 py-3">
          <div className="text-text-muted font-mono text-[11px] tracking-wide uppercase">
            Clothing
          </div>
          <div className="text-text mt-1 text-[14px]">
            {startingEquipment.clothing ? 'A set of ordinary clothing' : 'None'}
          </div>
        </div>

        {startingEquipment.weapon && (
          <div className="border-border bg-panel rounded border px-4 py-3">
            <div className="text-text-muted font-mono text-[11px] tracking-wide uppercase">
              Weapon
            </div>
            <div className="text-text mt-1 text-[14px]">{startingEquipment.weapon.en}</div>
          </div>
        )}

        {startingEquipment.items.length > 0 && (
          <div className="border-border bg-panel rounded border px-4 py-3">
            <div className="text-text-muted mb-1 font-mono text-[11px] tracking-wide uppercase">
              Items
            </div>
            <ul className="text-text flex flex-col gap-1 text-[14px]">
              {startingEquipment.items.map((item, i) => (
                <li key={i}>
                  {item.exact ? item.count : `up to ${item.count}`} item
                  {item.count === 1 && item.exact ? '' : 's'} — {PRICE_TIER_LABELS[item.priceTier]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-text-muted mt-5 font-mono text-[12px] italic">
        Starting cyphers aren’t part of this build yet — the content model has no cypher-assignment
        field for character creation. That’s a data-model gap, not a UI one.
      </p>
    </div>
  )
}
