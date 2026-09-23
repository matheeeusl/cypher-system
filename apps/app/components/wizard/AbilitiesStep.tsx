import type { WizardAbility, WizardFocus, WizardType } from '@/lib/graphql/queries'

import { focusTier1ChoiceEntries, focusTier1GrantedIds } from './derive'
import { TIER1_TYPE_ABILITY_COUNT } from './state'

interface AbilitiesStepProps {
  type: WizardType | undefined
  focus: WizardFocus | undefined
  abilities: WizardAbility[] | null
  loading: boolean
  error: string | null
  selectedTypeAbilityIds: string[]
  onToggleTypeAbility: (abilityId: string) => void
  focusChoiceSelections: number[][]
  onToggleFocusChoiceOption: (entryIndex: number, optionIndex: number) => void
}

export function AbilitiesStep({
  type,
  focus,
  abilities,
  loading,
  error,
  selectedTypeAbilityIds,
  onToggleTypeAbility,
  focusChoiceSelections,
  onToggleFocusChoiceOption,
}: AbilitiesStepProps) {
  if (!type) return <p className="text-text-muted text-sm">Choose a Type first.</p>
  if (loading) return <p className="text-text-muted text-sm">Loading Abilities…</p>
  if (error) return <p className="text-warning text-sm">Couldn’t load Abilities: {error}</p>
  if (!abilities) return null

  const abilityById = (id: string) => abilities.find((a) => a.id === id)
  const tier1 = type.tierAbilities.find((group) => group.tier === 1)
  const availableIds = tier1?.abilityIds ?? []
  const choiceEntries = focus ? focusTier1ChoiceEntries(focus) : []
  const grantedFocusIds = focus ? focusTier1GrantedIds(focus) : []

  return (
    <div>
      <div
        className={`mb-3.5 font-mono text-[12px] ${
          selectedTypeAbilityIds.length === TIER1_TYPE_ABILITY_COUNT
            ? 'text-accent'
            : 'text-text-muted'
        }`}
      >
        {selectedTypeAbilityIds.length} / {TIER1_TYPE_ABILITY_COUNT} selected
      </div>
      <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
        {availableIds.map((id) => {
          const ability = abilityById(id)
          const isSelected = selectedTypeAbilityIds.includes(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggleTypeAbility(id)}
              className={`flex items-start gap-3 rounded-[5px] border px-3.5 py-3 text-left ${
                isSelected ? 'border-accent bg-accent-soft' : 'border-border bg-panel'
              }`}
            >
              <span
                className={`text-bg mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] text-[11px] ${
                  isSelected ? 'border-accent bg-accent' : 'border-text-muted bg-transparent'
                }`}
              >
                {isSelected ? '✓' : ''}
              </span>
              <div>
                <div className="text-text text-[14px] font-medium">{ability?.name.en ?? id}</div>
                {ability?.cost && (
                  <div className="text-text-muted mt-0.5 font-mono text-[11px]">
                    {ability.cost.amount}{' '}
                    {ability.cost.pool.charAt(0) + ability.cost.pool.slice(1).toLowerCase()} point
                    {ability.cost.amount === 1 ? '' : 's'}
                  </div>
                )}
                {ability && (
                  <div className="text-text-muted mt-1 text-[12px] leading-relaxed">
                    {ability.description.en}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {grantedFocusIds.length > 0 && (
        <div className="mt-5">
          <div className="text-text-muted mb-2 font-mono text-[11px] tracking-wide uppercase">
            Granted automatically by your Focus
          </div>
          <div className="flex flex-wrap gap-2">
            {grantedFocusIds.map((id) => (
              <span
                key={id}
                className="border-accent bg-accent-soft text-accent rounded border px-3 py-1 font-mono text-[12px]"
              >
                {abilityById(id)?.name.en ?? id}
              </span>
            ))}
          </div>
        </div>
      )}

      {choiceEntries.map((entry, entryIndex) => {
        const selected = focusChoiceSelections[entryIndex] ?? []
        return (
          <div
            key={entry.options.map((o) => o.join('+')).join(',')}
            className="border-border bg-panel mt-5 rounded border p-4"
          >
            <div
              className={`mb-2 font-mono text-[11px] tracking-wide uppercase ${
                selected.length === entry.count ? 'text-accent' : 'text-text-muted'
              }`}
            >
              Focus choice — pick {entry.count} ({selected.length} / {entry.count} selected)
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.options.map((optionIds, optionIndex) => {
                const isSelected = selected.includes(optionIndex)
                const label = optionIds.map((id) => abilityById(id)?.name.en ?? id).join(' + ')
                return (
                  <button
                    key={optionIds.join('+')}
                    type="button"
                    onClick={() => onToggleFocusChoiceOption(entryIndex, optionIndex)}
                    className={`rounded border px-3 py-1.5 text-left font-mono text-[12px] ${
                      isSelected
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-border bg-panel text-text-muted'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
