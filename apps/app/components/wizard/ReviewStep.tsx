import type {
  Stat,
  WizardAbility,
  WizardDescriptor,
  WizardFlavor,
  WizardFocus,
  WizardSkill,
  WizardType,
} from '@/lib/graphql/queries'

import { Button } from '@cypher/ui'

import { customSkillText, isCustomSkill } from '@/lib/custom-skill'

import {
  descriptorAutoTrainedSkillIds,
  descriptorPoolBonus,
  focusTier1ChoiceEntries,
  focusTier1GrantedIds,
  tier1ChoiceSlots,
  tier1SkillGrantSlots,
} from './derive'
import { useWizardI18n } from './i18n'
import type { PoolAllocation, StepId, WizardChoices } from './state'

const POOL_STAT: Record<keyof PoolAllocation, Stat> = {
  might: 'MIGHT',
  speed: 'SPEED',
  intellect: 'INTELLECT',
}

interface ReviewStepProps {
  choices: WizardChoices
  type: WizardType | undefined
  descriptor: WizardDescriptor | undefined
  focus: WizardFocus | undefined
  flavor: WizardFlavor | undefined
  skills: WizardSkill[] | null
  abilities: WizardAbility[] | null
  onEdit: (stepId: StepId) => void
}

export function ReviewStep({
  choices,
  type,
  descriptor,
  focus,
  flavor,
  skills,
  abilities,
  onEdit,
}: ReviewStepProps) {
  const { copy, terms, t } = useWizardI18n()
  const fromDescriptor = descriptorPoolBonus(descriptor, choices.descriptorPoolChoice)
  const skillName = (id: string) => {
    if (isCustomSkill(id)) return customSkillText(id)
    const skill = skills?.find((s) => s.id === id)
    return skill ? t(skill.name) : id
  }
  const abilityName = (id: string) => {
    const ability = abilities?.find((a) => a.id === id)
    return ability ? t(ability.name) : id
  }

  // Skills from the Descriptor, then those picked for abilities that train skills.
  const abilitySkillIds = tier1SkillGrantSlots(choices, {
    type,
    descriptor,
    focus,
    flavor,
    abilities: abilities ?? undefined,
  }).flatMap((slot) => choices.abilitySkillChoices[slot.key] ?? [])
  const skillIds = [
    ...(descriptor
      ? [...descriptorAutoTrainedSkillIds(descriptor), ...choices.descriptorSkillChoices]
      : []),
    ...abilitySkillIds,
  ]

  const focusChoiceAbilityIds = focus
    ? focusTier1ChoiceEntries(focus).flatMap((entry, i) =>
        (choices.focusChoiceSelections[i] ?? []).flatMap(
          (optionIndex) => entry.options[optionIndex] ?? [],
        ),
      )
    : []
  // The abilities picked for choice abilities (blessings, cantrips) are part of the build.
  const chosenForAbilityIds = tier1ChoiceSlots(choices, {
    type,
    descriptor,
    focus,
    flavor,
    abilities: abilities ?? undefined,
  }).flatMap((slot) => choices.abilityChoices[slot.key] ?? [])
  const allAbilityIds = [
    ...choices.tier1TypeAbilityIds,
    ...chosenForAbilityIds,
    ...(focus ? focusTier1GrantedIds(focus) : []),
    ...focusChoiceAbilityIds,
  ]

  const rows: Array<{ key: keyof typeof copy.review.rows; value: string; stepId: StepId }> = [
    { key: 'type', value: type ? t(type.name) : '—', stepId: 'type' },
    { key: 'descriptor', value: descriptor ? t(descriptor.name) : '—', stepId: 'descriptor' },
    { key: 'focus', value: focus ? t(focus.name) : '—', stepId: 'focus' },
    // Optional, and chosen on the Abilities step where the pool it widens is.
    ...(choices.flavorId
      ? [
          {
            key: 'flavor' as const,
            value: flavor ? t(flavor.name) : '—',
            stepId: 'abilities' as const,
          },
        ]
      : []),
    {
      key: 'pools',
      // Type base + the 6 points + the Descriptor (fixed bonuses and choice).
      value: type
        ? (['might', 'speed', 'intellect'] as const)
            .map(
              (key) =>
                `${terms.stats[POOL_STAT[key]]} ${
                  type.startingPools[key] + choices.poolAllocation[key] + fromDescriptor[key]
                }`,
            )
            .join(' · ')
        : '—',
      stepId: 'pools',
    },
    {
      key: 'skills',
      value: skillIds.length > 0 ? skillIds.map(skillName).join(', ') : '—',
      stepId: 'skills',
    },
    {
      key: 'abilities',
      value: allAbilityIds.length > 0 ? allAbilityIds.map(abilityName).join(', ') : '—',
      stepId: 'abilities',
    },
    {
      key: 'equipment',
      value: type?.startingEquipment.weapon
        ? t(type.startingEquipment.weapon)
        : copy.review.clothingOnly,
      stepId: 'equipment',
    },
    { key: 'name', value: choices.name || '—', stepId: 'background' },
  ]

  return (
    <div>
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className="border-border flex flex-col gap-2 border-b py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <div>
              <div className="text-text-muted mb-0.5 font-mono text-[11px] tracking-wide uppercase">
                {copy.review.rows[row.key]}
              </div>
              <div className="font-display text-text text-[15px] font-semibold">{row.value}</div>
            </div>
            <Button label={copy.review.edit} variant="ghost" onClick={() => onEdit(row.stepId)} />
          </div>
        ))}
      </div>
    </div>
  )
}
