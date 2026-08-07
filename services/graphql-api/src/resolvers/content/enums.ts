// graphql-tools lets an SDL enum declare its "internal value" per name — the
// value a resolver actually returns/receives, distinct from the schema's
// public SCREAMING_CASE name. Declaring that mapping once here means every
// mapper in mappers.ts can pass @cypher/content's raw lowercase/snake_case
// strings straight through instead of hand-translating each field.
export const enumResolvers = {
  Stat: { MIGHT: 'might', SPEED: 'speed', INTELLECT: 'intellect' },
  PriceTier: {
    INEXPENSIVE: 'inexpensive',
    MODERATELY_PRICED: 'moderately_priced',
    EXPENSIVE: 'expensive',
    VERY_EXPENSIVE: 'very_expensive',
    EXORBITANT: 'exorbitant',
    PRICELESS: 'priceless',
  },
  WeaponCategory: { LIGHT: 'light', MEDIUM: 'medium', HEAVY: 'heavy' },
  ActionType: {
    ACTION: 'action',
    ENABLER: 'enabler',
    ACTION_TO_INITIATE: 'action_to_initiate',
    ACTION_TO_INITIATE_OR_REINITIATE: 'action_to_initiate_or_reinitiate',
  },
  AbilitySourceType: { TYPE: 'type', FOCUS: 'focus' },
  CypherCategory: {
    MANIFEST: 'manifest',
    FANTASTIC: 'fantastic',
    SUBTLE: 'subtle',
    POWER_BOOST: 'power_boost',
  },
  SkillLevel: {
    INABILITY: 'inability',
    PRACTICED: 'practiced',
    TRAINED: 'trained',
    SPECIALIZED: 'specialized',
  },
}
