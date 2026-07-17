import { describe, expect, it } from 'vitest'

import {
  applyAbilityTrainingPurchase,
  applyDescriptorSkills,
  applySkillAdvancementPurchase,
} from '../character/skills.js'
import type { AdvancementPurchase, KnownAbility } from '../character/types.js'

describe('applyDescriptorSkills', () => {
  it('seeds trained from skill_bonuses (real data: Strong -> smashing, jumping)', () => {
    const skills = applyDescriptorSkills({
      skill_bonuses: ['smashing', 'jumping'],
      skill_inabilities: [],
    })
    expect(skills).toEqual({
      smashing: { level: 'trained' },
      jumping: { level: 'trained' },
    })
  })

  it('seeds inability from skill_inabilities', () => {
    const skills = applyDescriptorSkills({ skill_bonuses: [], skill_inabilities: ['lore'] })
    expect(skills).toEqual({ lore: { level: 'inability' } })
  })
})

describe('applySkillAdvancementPurchase', () => {
  it('trains a skill that has never been touched (defaults to practiced)', () => {
    expect(applySkillAdvancementPurchase(undefined)).toBe('trained')
  })

  it('trains a practiced skill', () => {
    expect(applySkillAdvancementPurchase('practiced')).toBe('trained')
  })

  it('specializes an already-trained skill', () => {
    expect(applySkillAdvancementPurchase('trained')).toBe('specialized')
  })

  it('removes an inability, becoming practiced', () => {
    expect(applySkillAdvancementPurchase('inability')).toBe('practiced')
  })

  it('throws when training an already-specialized skill', () => {
    expect(() => applySkillAdvancementPurchase('specialized')).toThrow(/already specialized/)
  })
})

describe('applyAbilityTrainingPurchase', () => {
  const knownAbilities: KnownAbility[] = [
    { ability_id: 'bash', source: { kind: 'type', type_id: 'warrior' }, trained: false },
    { ability_id: 'overwatch', source: { kind: 'type', type_id: 'warrior' }, trained: false },
  ]

  it('marks the targeted known ability trained, without mutating the input', () => {
    const purchase: Extract<AdvancementPurchase, { option: 'skills' }> = {
      tier: 2,
      option: 'skills',
      target: { kind: 'ability', ability_id: 'bash' },
    }
    const result = applyAbilityTrainingPurchase(knownAbilities, purchase)

    expect(result.find((a) => a.ability_id === 'bash')?.trained).toBe(true)
    expect(knownAbilities.find((a) => a.ability_id === 'bash')?.trained).toBe(false) // original untouched
  })

  it('throws if the targeted ability is not already known', () => {
    const purchase: Extract<AdvancementPurchase, { option: 'skills' }> = {
      tier: 2,
      option: 'skills',
      target: { kind: 'ability', ability_id: 'onslaught' },
    }
    expect(() => applyAbilityTrainingPurchase(knownAbilities, purchase)).toThrow(
      /isn't among this character's known abilities/,
    )
  })

  it('is a no-op for a skill-target purchase', () => {
    const purchase: Extract<AdvancementPurchase, { option: 'skills' }> = {
      tier: 2,
      option: 'skills',
      target: { kind: 'skill', skill_id: 'climbing' },
    }
    expect(applyAbilityTrainingPurchase(knownAbilities, purchase)).toBe(knownAbilities)
  })
})
