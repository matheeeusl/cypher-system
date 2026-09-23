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
  const skillName = (id: string) => skills?.find((s) => s.id === id)?.name.en ?? id
  const abilityName = (id: string) => abilities?.find((a) => a.id === id)?.name.en ?? id

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

  const rows: Array<{ label: string; value: string; stepId: StepId }> = [
    { label: 'TYPE', value: type?.name.en ?? '—', stepId: 'type' },
    { label: 'DESCRIPTOR', value: descriptor?.name.en ?? '—', stepId: 'descriptor' },
    { label: 'FOCUS', value: focus?.name.en ?? '—', stepId: 'focus' },
    {
      label: 'POOLS',
      value: type
        ? `Might ${type.startingPools.might + choices.poolAllocation.might} · Speed ${
            type.startingPools.speed + choices.poolAllocation.speed
          } · Intellect ${type.startingPools.intellect + choices.poolAllocation.intellect}`
        : '—',
      stepId: 'pools',
    },
    {
      label: 'SKILLS',
      value: skillIds.length > 0 ? skillIds.map(skillName).join(', ') : '—',
      stepId: 'skills',
    },
    {
      label: 'ABILITIES',
      value: allAbilityIds.length > 0 ? allAbilityIds.map(abilityName).join(', ') : '—',
      stepId: 'abilities',
    },
    {
      label: 'EQUIPMENT',
      value: type?.startingEquipment.weapon?.en ?? 'Clothing only',
      stepId: 'equipment',
    },
    { label: 'CHARACTER NAME', value: choices.name || '—', stepId: 'background' },
  ]

  return (
    <div>
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="border-border flex items-start justify-between gap-4 border-b py-3 last:border-b-0"
          >
            <div>
              <div className="text-text-muted mb-0.5 font-mono text-[11px] tracking-wide uppercase">
                {row.label}
              </div>
              <div className="font-display text-text text-[15px] font-semibold">{row.value}</div>
            </div>
            <Button label="Edit" variant="ghost" onClick={() => onEdit(row.stepId)} />
          </div>
        ))}
      </div>

      <div className="border-border bg-panel mt-6 rounded border px-4 py-3.5">
        <p className="text-text-muted text-[13px] leading-relaxed">
          Saving requires an account, which isn’t built yet — this step is a preview only for now.
        </p>
      </div>
    </div>
  )
}
