import { useState } from 'react'

import type { WizardDescriptor, WizardSkill } from '@/lib/graphql/queries'

import { customSkillText, isCustomSkill } from '@/lib/custom-skill'

import { CustomSkillInput } from './CustomSkillInput'
import {
  descriptorAutoTrainedSkillIds,
  descriptorSkillChoicesNeeded,
  descriptorSpecializedSkillIds,
} from './derive'
import { useWizardI18n } from './i18n'

interface SkillsStepProps {
  descriptor: WizardDescriptor | undefined
  skills: WizardSkill[] | null
  loading: boolean
  error: string | null
  selectedSkillIds: string[]
  onToggle: (skillId: string) => void
}

export function SkillsStep({
  descriptor,
  skills,
  loading,
  error,
  selectedSkillIds,
  onToggle,
}: SkillsStepProps) {
  const { copy, terms, t } = useWizardI18n()
  // The fixed skill whose description is open (same toggle as play mode's Skills tab).
  const [openSkillId, setOpenSkillId] = useState<string | null>(null)
  if (!descriptor) {
    return <p className="text-text-muted text-sm">{copy.chooseDescriptorFirst}</p>
  }
  if (loading)
    return <p className="text-text-muted text-sm">{copy.loading(copy.entities.skills)}</p>
  if (error) {
    return <p className="text-warning text-sm">{copy.loadFailed(copy.entities.skills, error)}</p>
  }
  if (!skills) return null

  const skillName = (id: string) => {
    const skill = skills.find((s) => s.id === id)
    return skill ? t(skill.name) : id
  }
  const autoTrainedIds = descriptorAutoTrainedSkillIds(descriptor)
  const specializedIds = descriptorSpecializedSkillIds(descriptor)
  const needed = descriptorSkillChoicesNeeded(descriptor)
  const pickable = skills.filter((s) => !autoTrainedIds.includes(s.id))
  // Skills the player typed, picked in place of a catalog one.
  const typedPicks = selectedSkillIds.filter(isCustomSkill)

  return (
    <div>
      {autoTrainedIds.length > 0 && (
        <div className="mb-5">
          <div className="text-text-muted mb-2 font-mono text-[11px] tracking-wide uppercase">
            {copy.skills.autoTrained(t(descriptor.name))}
          </div>
          <div className="flex flex-wrap gap-2">
            {autoTrainedIds.map((id) => {
              const open = openSkillId === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenSkillId(open ? null : id)}
                  className={`border-accent text-accent cursor-pointer rounded border px-3 py-1 font-mono text-[12px] transition-colors hover:opacity-80 ${
                    open ? 'bg-accent-soft ring-accent ring-1' : 'bg-accent-soft'
                  }`}
                >
                  {skillName(id)}
                  {specializedIds.includes(id) && (
                    <span className="text-warning"> · {terms.skillLevels.SPECIALIZED}</span>
                  )}
                </button>
              )
            })}
          </div>
          {(() => {
            const skill = skills.find((s) => s.id === openSkillId)
            if (!skill) return null
            return (
              <div className="border-border bg-panel mt-3 rounded border px-3.5 py-3">
                <div className="font-display text-text mb-1 text-sm font-semibold">
                  {t(skill.name)}
                </div>
                <p className="text-text-muted text-[13px] leading-relaxed">
                  {t(skill.description)}
                </p>
              </div>
            )
          })()}
        </div>
      )}

      {needed > 0 ? (
        <>
          <div
            className={`mb-3.5 font-mono text-[12px] ${
              selectedSkillIds.length === needed ? 'text-accent' : 'text-text-muted'
            }`}
          >
            {copy.skills.selected(selectedSkillIds.length, needed)}
          </div>
          <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
            {typedPicks.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(id)}
                className="border-accent bg-accent-soft flex cursor-pointer items-center gap-3 rounded border px-3.5 py-3 text-left"
              >
                <span className="text-bg border-accent bg-accent flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] text-[11px]">
                  ✓
                </span>
                <span className="text-text text-[14px] font-medium">{customSkillText(id)}</span>
              </button>
            ))}
            {pickable.map((skill) => {
              const isSelected = selectedSkillIds.includes(skill.id)
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => onToggle(skill.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded border px-3.5 py-3 text-left ${
                    isSelected ? 'border-accent bg-accent-soft' : 'border-border bg-panel'
                  }`}
                >
                  <span
                    className={`text-bg flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] text-[11px] ${
                      isSelected ? 'border-accent bg-accent' : 'border-text-muted bg-transparent'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                  <span className="text-text text-[14px] font-medium">{t(skill.name)}</span>
                </button>
              )
            })}
          </div>
          <CustomSkillInput
            disabled={selectedSkillIds.length >= needed}
            onAdd={(id) => {
              const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
              if (!selectedSkillIds.some((picked) => same(picked, id))) onToggle(id)
            }}
          />
        </>
      ) : (
        <p className="text-text-muted text-sm">{copy.skills.noExtraChoices(t(descriptor.name))}</p>
      )}
    </div>
  )
}
