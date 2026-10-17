import { useState } from 'react'

import { customSkillText, isCustomSkill } from '@/lib/custom-skill'
import { DocsLink } from '@/components/DocsLink'
import { docsLinks } from '@/lib/docs-links'
import type {
  Stat,
  WizardAbility,
  WizardFlavor,
  WizardFocus,
  WizardSkill,
  WizardType,
} from '@/lib/graphql/queries'

import {
  focusTier1ChoiceEntries,
  focusTier1GrantedIds,
  tier1PickPool,
  type ChoiceSlot,
  type EdgeSlot,
  type SkillGrantSlot,
} from './derive'
import { CustomSkillInput } from './CustomSkillInput'
import { useWizardI18n } from './i18n'
import { TIER1_TYPE_ABILITY_COUNT } from './state'

interface AbilitiesStepProps {
  type: WizardType | undefined
  focus: WizardFocus | undefined
  /** Every flavor, for the optional selector; null while loading. */
  flavors: WizardFlavor[] | null
  flavorError: string | null
  selectedFlavorId: string | null
  /** A flavor gained in play: shown instead of the selector, which stays locked. */
  gainedFlavorId: string | null
  onSelectFlavor: (flavorId: string | null) => void
  abilities: WizardAbility[] | null
  loading: boolean
  error: string | null
  selectedTypeAbilityIds: string[]
  onToggleTypeAbility: (abilityId: string) => void
  focusChoiceSelections: number[][]
  onToggleFocusChoiceOption: (entryIndex: number, optionIndex: number) => void
  /** The chosen abilities that ask for other abilities (Blessing of the Gods, Cantrips). */
  choiceSlots: ChoiceSlot[]
  abilityChoices: Record<string, string[]>
  onToggleAbilityChoice: (slot: ChoiceSlot, abilityId: string) => void
  /** The chosen abilities that raise an Edge the player picks (Improved Edge). */
  edgeSlots: EdgeSlot[]
  abilityEdgeChoices: Record<string, Stat>
  onPickEdge: (slot: EdgeSlot, stat: Stat) => void
  /** Skill catalog, for the pickers under abilities that train skills. */
  skills: WizardSkill[] | null
  /** The chosen/granted abilities that train skills, one picker each. */
  skillGrantSlots: SkillGrantSlot[]
  abilitySkillChoices: Record<string, string[]>
  /** Skills already trained by the Descriptor — can't be picked again. */
  trainedSkillIds: string[]
  /** The ones it starts specialized (the Elf's perception) — the maximum, so
   * no grant can take them, whatever its mode. */
  specializedSkillIds: string[]
  onToggleAbilitySkill: (slot: SkillGrantSlot, skillId: string) => void
}

export function AbilitiesStep({
  type,
  focus,
  flavors,
  flavorError,
  selectedFlavorId,
  gainedFlavorId,
  onSelectFlavor,
  abilities,
  loading,
  error,
  selectedTypeAbilityIds,
  onToggleTypeAbility,
  focusChoiceSelections,
  onToggleFocusChoiceOption,
  choiceSlots,
  abilityChoices,
  onToggleAbilityChoice,
  edgeSlots,
  abilityEdgeChoices,
  onPickEdge,
  skills,
  skillGrantSlots,
  abilitySkillChoices,
  trainedSkillIds,
  specializedSkillIds,
  onToggleAbilitySkill,
}: AbilitiesStepProps) {
  const { copy, terms, t, locale } = useWizardI18n()
  // The Focus-granted ability whose description is open (same toggle as play mode).
  const [openGrantedId, setOpenGrantedId] = useState<string | null>(null)
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
  const selectedFlavor = flavors?.find((f) => f.id === selectedFlavorId)
  const pool = tier1PickPool(type, selectedFlavor)
  const choiceEntries = focus ? focusTier1ChoiceEntries(focus) : []
  const grantedFocusIds = focus ? focusTier1GrantedIds(focus) : []

  return (
    <div>
      <div className="border-border bg-panel mb-5 rounded border p-4">
        <div className="text-text-muted mb-1 font-mono text-[11px] tracking-wide uppercase">
          {copy.abilities.flavor.heading}
        </div>
        <p className="text-text-muted mb-3 text-[12px] leading-relaxed">
          {copy.abilities.flavor.hint}
        </p>
        {gainedFlavorId ? (
          <>
            <p className="text-text font-mono text-[12px]">
              {copy.abilities.flavor.gained(
                (() => {
                  const gained = flavors?.find((f) => f.id === gainedFlavorId)
                  return gained ? t(gained.name) : gainedFlavorId
                })(),
              )}
            </p>
            <p className="text-text-muted mt-1 text-[12px] leading-relaxed">
              {copy.abilities.flavor.gainedNote}
            </p>
          </>
        ) : flavorError ? (
          <p className="text-warning text-[12px]">
            {copy.loadFailed(copy.abilities.flavor.heading, flavorError)}
          </p>
        ) : !flavors ? (
          <p className="text-text-muted text-[12px]">{copy.abilities.flavor.loading}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[
              { id: null, label: copy.abilities.flavor.none },
              ...flavors.map((f) => ({ id: f.id, label: t(f.name) })),
            ].map((option) => {
              const isSelected = option.id === selectedFlavorId
              return (
                <button
                  key={option.id ?? 'none'}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectFlavor(option.id)}
                  className={`cursor-pointer rounded border px-3 py-1.5 text-left font-mono text-[12px] ${
                    isSelected
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border bg-panel text-text-muted'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        )}
        {selectedFlavor && (
          <div className="mt-3">
            <DocsLink href={docsLinks.entity(locale, 'flavors', selectedFlavor.id)} />
          </div>
        )}
      </div>
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
        {pool.map(({ id, fromFlavor }) => {
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
                <div className="text-text text-[14px] font-medium">
                  {abilityName(id)}
                  {fromFlavor && selectedFlavor && (
                    <span className="border-border text-text-muted ml-2 rounded border px-1.5 py-px font-mono text-[10px] tracking-wide uppercase">
                      {copy.abilities.flavor.badge}: {t(selectedFlavor.name)}
                    </span>
                  )}
                </div>
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
            {grantedFocusIds.map((id) => {
              const open = openGrantedId === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenGrantedId(open ? null : id)}
                  className={`border-accent bg-accent-soft text-accent cursor-pointer rounded border px-3 py-1 font-mono text-[12px] transition-colors hover:opacity-80 ${
                    open ? 'ring-accent ring-1' : ''
                  }`}
                >
                  {abilityName(id)}
                </button>
              )
            })}
          </div>
          {(() => {
            const ability = openGrantedId ? abilityById(openGrantedId) : undefined
            if (!ability) return null
            return (
              <div className="border-border bg-panel mt-3 rounded border px-3.5 py-3">
                <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-text text-sm font-semibold">
                    {t(ability.name)}
                  </span>
                  {ability.cost && (
                    <span className="text-accent font-mono text-[11px]">
                      {terms.cost(ability.cost.amount, ability.cost.pool)}
                    </span>
                  )}
                </div>
                <p className="text-text-muted text-[13px] leading-relaxed">
                  {t(ability.description)}
                </p>
              </div>
            )
          })()}
        </div>
      )}

      {choiceSlots.map((slot) => {
        const picked = abilityChoices[slot.key] ?? []
        // An ability picked elsewhere (a Type pick, another blessing) can't be taken again.
        const taken = new Set(selectedTypeAbilityIds)
        const sorted = [...slot.options].sort((a, b) =>
          abilityName(a).localeCompare(abilityName(b)),
        )
        return (
          <div key={slot.key} className="border-border bg-panel mt-5 rounded border p-4">
            <div
              className={`mb-2 font-mono text-[11px] tracking-wide uppercase ${
                picked.length === slot.count ? 'text-accent' : 'text-text-muted'
              }`}
            >
              {copy.abilities.optionPick(abilityName(slot.abilityId), picked.length, slot.count)}
            </div>
            <div className="flex max-h-[260px] flex-wrap gap-2 overflow-y-auto pr-1">
              {sorted.map((optionId) => {
                const isSelected = picked.includes(optionId)
                const isUnavailable = !isSelected && taken.has(optionId)
                const ability = abilityById(optionId)
                return (
                  <button
                    key={optionId}
                    type="button"
                    disabled={isUnavailable}
                    aria-pressed={isSelected}
                    title={ability ? t(ability.description) : undefined}
                    onClick={() => onToggleAbilityChoice(slot, optionId)}
                    className={`rounded border px-3 py-1.5 text-left font-mono text-[12px] ${
                      isSelected
                        ? 'border-accent bg-accent-soft text-accent cursor-pointer'
                        : isUnavailable
                          ? 'border-border bg-panel text-text-muted cursor-not-allowed opacity-40'
                          : 'border-border bg-panel text-text-muted cursor-pointer'
                    }`}
                  >
                    {abilityName(optionId)}
                  </button>
                )
              })}
            </div>
            {picked.length > 0 && (
              <ul className="text-text-muted mt-3 flex flex-col gap-1.5 text-[12px] leading-relaxed">
                {picked.map((optionId) => {
                  const ability = abilityById(optionId)
                  return (
                    <li key={optionId}>
                      <span className="text-text font-medium">{abilityName(optionId)}</span>
                      {ability?.cost && (
                        <span className="ml-2 font-mono text-[11px]">
                          {terms.cost(ability.cost.amount, ability.cost.pool)}
                        </span>
                      )}
                      {ability && <> — {t(ability.description)}</>}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}

      {edgeSlots.map((slot) => {
        // Only Edges still at 0 are offered, so a pick left over from another
        // starting Edge simply shows as unpicked.
        const picked = abilityEdgeChoices[slot.key]
        const done = picked !== undefined && slot.options.includes(picked)
        return (
          <div key={slot.key} className="border-border bg-panel mt-5 rounded border p-4">
            <div
              className={`mb-2 font-mono text-[11px] tracking-wide uppercase ${
                done ? 'text-accent' : 'text-text-muted'
              }`}
            >
              {copy.abilities.edgePick(abilityName(slot.abilityId))}
            </div>
            <div className="flex flex-wrap gap-2">
              {slot.options.map((stat) => (
                <button
                  key={stat}
                  type="button"
                  aria-pressed={picked === stat}
                  onClick={() => onPickEdge(slot, stat)}
                  className={`cursor-pointer rounded border px-3 py-1.5 font-mono text-[12px] ${
                    picked === stat
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border bg-panel text-text-muted'
                  }`}
                >
                  {terms.stats[stat]} +1
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {skillGrantSlots.map((slot) => {
        const picked = abilitySkillChoices[slot.key] ?? []
        // What can't be picked depends on the grant's mode: a plain "train"
        // refuses anything already trained or picked by another ability; the
        // upgrade modes only refuse a skill already chosen for this same
        // ability (a different one is needed each time), and "specialize"
        // also needs the skill to be trained already.
        const otherSlots = skillGrantSlots.filter((other) => other.key !== slot.key)
        const takenElsewhere = otherSlots
          .filter((other) => slot.mode === 'train' || other.abilityId === slot.abilityId)
          .flatMap((other) => abilitySkillChoices[other.key] ?? [])
        const unavailable = new Set(takenElsewhere)
        // With an alternate shape ("or specialized in one") a trained skill is
        // still a valid pick, so nothing is hidden for being trained.
        if (slot.mode === 'train' && !slot.alternate) {
          trainedSkillIds.forEach((id) => unavailable.add(id))
        }
        specializedSkillIds.forEach((id) => unavailable.add(id))
        const candidates = (skills ?? [])
          .filter((skill) => (slot.noncombat ? !skill.combat : slot.options.includes(skill.id)))
          .sort((a, b) => t(a.name).localeCompare(t(b.name)))
        return (
          <div key={slot.key} className="border-border bg-panel mt-5 rounded border p-4">
            <div
              className={`mb-2 font-mono text-[11px] tracking-wide uppercase ${
                picked.length === slot.count || picked.length === slot.alternate?.count
                  ? 'text-accent'
                  : 'text-text-muted'
              }`}
            >
              {copy.abilities.skillPick(abilityName(slot.abilityId), picked.length, slot.count)}
            </div>
            {slot.alternate && (
              <p className="text-text-muted mb-2 text-[12px]">
                {copy.abilities.skillAlternate(slot.alternate.count)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {picked.filter(isCustomSkill).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggleAbilitySkill(slot, id)}
                  className="border-accent bg-accent-soft text-accent cursor-pointer rounded border px-3 py-1.5 text-left font-mono text-[12px]"
                >
                  {customSkillText(id)}
                </button>
              ))}
              {candidates.map((skill) => {
                const isSelected = picked.includes(skill.id)
                const isUnavailable =
                  !isSelected &&
                  (unavailable.has(skill.id) ||
                    (slot.mode === 'specialize' && !trainedSkillIds.includes(skill.id)))
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
            {slot.allowCustom && (
              <CustomSkillInput
                disabled={picked.length >= Math.max(slot.count, slot.alternate?.count ?? 0)}
                onAdd={(id) => {
                  if (!picked.includes(id)) onToggleAbilitySkill(slot, id)
                }}
              />
            )}
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
