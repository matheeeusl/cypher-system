/**
 * A skill the player typed instead of picking from the catalog ("chess",
 * "Archaeology"). It travels as `custom:<text>` — the same form
 * @cypher/engine keeps it in — so it can sit in the same lists as skill ids.
 */
export const CUSTOM_SKILL_PREFIX = 'custom:'
export const CUSTOM_SKILL_MAX_LENGTH = 60

export const isCustomSkill = (id: string) => id.startsWith(CUSTOM_SKILL_PREFIX)

/** The typed text of a custom skill id. */
export const customSkillText = (id: string) => id.slice(CUSTOM_SKILL_PREFIX.length)

/** Turns what was typed into a custom skill id, or null when it's empty or too long. */
export function toCustomSkill(text: string): string | null {
  const tidy = text.trim().replace(/\s+/g, ' ')
  if (tidy.length === 0 || tidy.length > CUSTOM_SKILL_MAX_LENGTH) return null
  return CUSTOM_SKILL_PREFIX + tidy
}

/** A skill id as stored: a catalog id, or `custom:` plus printable text. */
export function isSkillIdShape(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (isCustomSkill(value)) {
    const text = customSkillText(value)
    // eslint-disable-next-line no-control-regex
    return (
      text.length > 0 && text.length <= CUSTOM_SKILL_MAX_LENGTH && !/[\u0000-\u001f]/.test(text)
    )
  }
  return /^[a-z0-9][a-z0-9-]{0,99}$/.test(value)
}
