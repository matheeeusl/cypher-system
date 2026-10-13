import type { WizardAbility, WizardFocus, WizardSkill, WizardType } from '@/lib/graphql/queries'

import { focusTier1ChoiceEntries, focusTier1GrantedIds, type SkillGrantSlot } from './derive'
import { useWizardI18n } from './i18n'
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
  /** Skill catalog, for the pickers under abilities that train skills. */
  skills: WizardSkill[] | null
  /** The chosen/granted abilities that train skills, one picker each. */
  skillGrantSlots: SkillGrantSlot[]
  abilitySkillChoices: Record<string, string[]>
  /** Skills already trained by the Descriptor — can't be picked again. */
  trainedSkillIds: string[]
  onToggleAbilitySkill: (slot: SkillGrantSlot, skillId: string) => void
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
  skills,
  skillGrantSlots,
  abilitySkillChoices,
  trainedSkillIds,
  onToggleAbilitySkill,
}: AbilitiesStepProps) {
  const { copy, terms, t } = useWizardI18n()
  if (!type) return <p className="text-text-muted text-sm">{copy.chooseTypeFirst}</p>
  if (loading) {
    return <p className="text-text-muted text-sm">{copy.loading(copy.entities.abilities)}</p>
  }
  if (error) {
    return <p className="text-warning text-sm">{copy.loadFailed(copy.entities.abilities, error)}</p>
  }
  if (!abilities) return null

  const abilityById = (id: string) => abilities.find((a) => a.id === id)
  const abilityName = (id: string) => {
    const ability = abilityById(id)
    return ability ? t(ability.name) : id
  }
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
        {copy.abilities.selected(selectedTypeAbilityIds.length, TIER1_TYPE_ABILITY_COUNT)}
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
              className={`flex cursor-pointer items-start gap-3 rounded-[5px] border px-3.5 py-3 text-left ${
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
                <div className="text-text text-[14px] font-medium">{abilityName(id)}</div>
                {ability?.cost && (
                  <div className="text-text-muted mt-0.5 font-mono text-[11px]">
                    {terms.cost(ability.cost.amount, ability.cost.pool)}
                  </div>
                )}
                {ability && (
                  <div className="text-text-muted mt-1 text-[12px] leading-relaxed">
                    {t(ability.description)}
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
            {copy.abilities.grantedByFocus}
          </div>
          <div className="flex flex-wrap gap-2">
            {grantedFocusIds.map((id) => (
              <span
                key={id}
                className="border-accent bg-accent-soft text-accent rounded border px-3 py-1 font-mono text-[12px]"
              >
                {abilityName(id)}
              </span>
            ))}
          </div>
        </div>
      )}

      {skillGrantSlots.map((slot) => {
        const picked = abilitySkillChoices[slot.key] ?? []
        const takenElsewhere = skillGrantSlots
          .filter((other) => other.key !== slot.key)
          .flatMap((other) => abilitySkillChoices[other.key] ?? [])
        const unavailable = new Set([...trainedSkillIds, ...takenElsewhere])
        const candidates = (skills ?? [])
          .filter((skill) => slot.any || slot.options.includes(skill.id))
          .sort((a, b) => t(a.name).localeCompare(t(b.name)))
        return (
          <div key={slot.key} className="border-border bg-panel mt-5 rounded border p-4">
            <div
              className={`mb-2 font-mono text-[11px] tracking-wide uppercase ${
                picked.length === slot.count ? 'text-accent' : 'text-text-muted'
              }`}
            >
              {copy.abilities.skillPick(abilityName(slot.abilityId), picked.length, slot.count)}
            </div>
            <div className="flex flex-wrap gap-2">
              {candidates.map((skill) => {
                const isSelected = picked.includes(skill.id)
                const isUnavailable = !isSelected && unavailable.has(skill.id)
                return (
                  <button
                    key={skill.id}
                    type="button"
                    disabled={isUnavailable}
                    title={isUnavailable ? copy.abilities.skillTaken : undefined}
                    onClick={() => onToggleAbilitySkill(slot, skill.id)}
                    className={`rounded border px-3 py-1.5 text-left font-mono text-[12px] ${
                      isSelected
                        ? 'border-accent bg-accent-soft text-accent cursor-pointer'
                        : isUnavailable
                          ? 'border-border bg-panel text-text-muted cursor-not-allowed opacity-40'
                          : 'border-border bg-panel text-text-muted cursor-pointer'
                    }`}
                  >
                    {t(skill.name)}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

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
              {copy.abilities.focusChoice(entry.count, selected.length, entry.count)}
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.options.map((optionIds, optionIndex) => {
                const isSelected = selected.includes(optionIndex)
                const label = optionIds.map(abilityName).join(' + ')
                return (
                  <button
                    key={optionIds.join('+')}
                    type="button"
                    onClick={() => onToggleFocusChoiceOption(entryIndex, optionIndex)}
                    className={`cursor-pointer rounded border px-3 py-1.5 text-left font-mono text-[12px] ${
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
