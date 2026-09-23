import type { WizardDescriptor, WizardSkill } from '@/lib/graphql/queries'

import { descriptorAutoTrainedSkillIds, descriptorSkillChoicesNeeded } from './derive'

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
  if (!descriptor) return <p className="text-text-muted text-sm">Choose a Descriptor first.</p>
  if (loading) return <p className="text-text-muted text-sm">Loading Skills…</p>
  if (error) return <p className="text-warning text-sm">Couldn’t load Skills: {error}</p>
  if (!skills) return null

  const skillName = (id: string) => skills.find((s) => s.id === id)?.name.en ?? id
  const autoTrainedIds = descriptorAutoTrainedSkillIds(descriptor)
  const needed = descriptorSkillChoicesNeeded(descriptor)
  const pickable = skills.filter((s) => !autoTrainedIds.includes(s.id))

  return (
    <div>
      {autoTrainedIds.length > 0 && (
        <div className="mb-5">
          <div className="text-text-muted mb-2 font-mono text-[11px] tracking-wide uppercase">
            Trained automatically by {descriptor.name.en}
          </div>
          <div className="flex flex-wrap gap-2">
            {autoTrainedIds.map((id) => (
              <span
                key={id}
                className="border-accent bg-accent-soft text-accent rounded border px-3 py-1 font-mono text-[12px]"
              >
                {skillName(id)}
              </span>
            ))}
          </div>
        </div>
      )}

      {needed > 0 ? (
        <>
          <div
            className={`mb-3.5 font-mono text-[12px] ${
              selectedSkillIds.length === needed ? 'text-accent' : 'text-text-muted'
            }`}
          >
            {selectedSkillIds.length} / {needed} selected
          </div>
          <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
            {pickable.map((skill) => {
              const isSelected = selectedSkillIds.includes(skill.id)
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => onToggle(skill.id)}
                  className={`flex items-center gap-3 rounded border px-3.5 py-3 text-left ${
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
                  <span className="text-text text-[14px] font-medium">{skill.name.en}</span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <p className="text-text-muted text-sm">
          {descriptor.name.en} doesn’t grant any additional skill choices beyond what’s listed
          above.
        </p>
      )}
    </div>
  )
}
