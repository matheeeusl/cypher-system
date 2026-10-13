import type { WizardType } from '@/lib/graphql/queries'

import { useWizardI18n } from './i18n'

interface EquipmentStepProps {
  type: WizardType | undefined
}

export function EquipmentStep({ type }: EquipmentStepProps) {
  const { copy, terms, t } = useWizardI18n()
  if (!type) return <p className="text-text-muted text-sm">{copy.chooseTypeFirst}</p>

  const { startingEquipment } = type

  return (
    <div>
      <p className="text-text-muted mb-4 text-[13px] leading-relaxed">
        {copy.equipment.fixedByType}
      </p>

      <div className="flex flex-col gap-3">
        <div className="border-border bg-panel rounded border px-4 py-3">
          <div className="text-text-muted font-mono text-[11px] tracking-wide uppercase">
            {terms.clothing}
          </div>
          <div className="text-text mt-1 text-[14px]">
            {startingEquipment.clothing ? terms.clothingItem : copy.equipment.none}
          </div>
        </div>

        {startingEquipment.weapon && (
          <div className="border-border bg-panel rounded border px-4 py-3">
            <div className="text-text-muted font-mono text-[11px] tracking-wide uppercase">
              {terms.weapon}
            </div>
            <div className="text-text mt-1 text-[14px]">{t(startingEquipment.weapon)}</div>
          </div>
        )}

        {startingEquipment.items.length > 0 && (
          <div className="border-border bg-panel rounded border px-4 py-3">
            <div className="text-text-muted mb-1 font-mono text-[11px] tracking-wide uppercase">
              {copy.equipment.items}
            </div>
            <ul className="text-text flex flex-col gap-1 text-[14px]">
              {startingEquipment.items.map((item, i) => (
                <li key={i}>{terms.items(item.count, item.exact, item.priceTier)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-text-muted mt-5 font-mono text-[12px] italic">
        {copy.equipment.cyphersNote}
      </p>
    </div>
  )
}
