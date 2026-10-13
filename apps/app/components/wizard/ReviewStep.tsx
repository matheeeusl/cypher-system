import type {
  WizardAbility,
  WizardDescriptor,
  WizardFocus,
  WizardSkill,
  WizardType,
} from '@/lib/graphql/queries'

import { Button } from '@cypher/ui'

import {
  descriptorAutoTrainedSkillIds,
  focusTier1ChoiceEntries,
  focusTier1GrantedIds,
} from './derive'
import { useWizardI18n } from './i18n'
import type { StepId, WizardChoices } from './state'

interface ReviewStepProps {
  choices: WizardChoices
  type: WizardType | undefined
  descriptor: WizardDescriptor | undefined
  focus: WizardFocus | undefined
  skills: WizardSkill[] | null
  abilities: WizardAbility[] | null
  onEdit: (stepId: StepId) => void
}

export function ReviewStep({
  choices,
  type,
  descriptor,
  focus,
  skills,
  abilities,
  onEdit,
}: ReviewStepProps) {
  const { copy, terms, t } = useWizardI18n()
  const skillName = (id: string) => {
    const skill = skills?.find((s) => s.id === id)
    return skill ? t(skill.name) : id
  }
  const abilityName = (id: string) => {
    const ability = abilities?.find((a) => a.id === id)
    return ability ? t(ability.name) : id
  }

  const skillIds = descriptor
    ? [...descriptorAutoTrainedSkillIds(descriptor), ...choices.descriptorSkillChoices]
    : []

  const focusChoiceAbilityIds = focus
    ? focusTier1ChoiceEntries(focus).flatMap((entry, i) =>
        (choices.focusChoiceSelections[i] ?? []).flatMap(
          (optionIndex) => entry.options[optionIndex] ?? [],
        ),
      )
    : []
  const allAbilityIds = [
    ...choices.tier1TypeAbilityIds,
    ...(focus ? focusTier1GrantedIds(focus) : []),
    ...focusChoiceAbilityIds,
  ]

  const rows: Array<{ key: keyof typeof copy.review.rows; value: string; stepId: StepId }> = [
    { key: 'type', value: type ? t(type.name) : '—', stepId: 'type' },
    { key: 'descriptor', value: descriptor ? t(descriptor.name) : '—', stepId: 'descriptor' },
    { key: 'focus', value: focus ? t(focus.name) : '—', stepId: 'focus' },
    {
      key: 'pools',
      value: type
        ? `${terms.stats.MIGHT} ${type.startingPools.might + choices.poolAllocation.might} · ${
            terms.stats.SPEED
          } ${type.startingPools.speed + choices.poolAllocation.speed} · ${terms.stats.INTELLECT} ${
            type.startingPools.intellect + choices.poolAllocation.intellect
          }`
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
            className="border-border flex items-start justify-between gap-4 border-b py-3 last:border-b-0"
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
