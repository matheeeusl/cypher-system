import type { AdvancementChoice } from '@/lib/advancement'
import type { DerivedBundle } from '@/lib/character-derived'
import { customSkillText, isCustomSkill } from '@/lib/custom-skill'
import type { Stat } from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import { playCopy } from '@/lib/i18n/play'
import { terms } from '@/lib/i18n/terms'
import { LIMITS } from '@/lib/play'

/** The XP-log line for a purchase, in the buyer's language. */
export function advancementReason(
  locale: Locale,
  choice: AdvancementChoice,
  bundle: Pick<DerivedBundle, 'skills' | 'abilities'>,
): string {
  const copy = playCopy[locale]
  const t = terms[locale]
  const name = copy.advancement.steps[choice.key].split(' — ')[0]
  const stat = (s: Stat) => t.stats[s]
  let detail: string
  switch (choice.key) {
    case 'pools':
      detail = (['MIGHT', 'SPEED', 'INTELLECT'] as const)
        .filter((st) => choice.allocation[st.toLowerCase() as keyof typeof choice.allocation] > 0)
        .map(
          (st) =>
            `+${choice.allocation[st.toLowerCase() as keyof typeof choice.allocation]} ${stat(st)}`,
        )
        .join(', ')
      break
    case 'edge':
      detail = `+1 ${copy.pools.edge} ${stat(choice.stat)}`
      break
    case 'effort':
      detail = `+1 ${copy.pools.effort}`
      break
    case 'skills': {
      if ('skillId' in choice) {
        const skill = bundle.skills.find((s) => s.id === choice.skillId)
        detail = skill
          ? loc(skill.name, locale)
          : isCustomSkill(choice.skillId)
            ? customSkillText(choice.skillId)
            : choice.skillId
      } else {
        const ability = bundle.abilities.find((a) => a.id === choice.abilityId)
        detail = ability ? loc(ability.name, locale) : choice.abilityId
      }
      break
    }
  }
  return `${copy.advancement.title} — ${name} (${detail})`.slice(0, LIMITS.reason)
}
