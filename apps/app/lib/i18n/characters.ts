import type { CharacterListLabels } from '@cypher/ui'

import type { Locale } from '@/lib/i18n/auth'

// "Tier" is "Grau" per the project glossary ("Nível" is reserved for Level) —
// the Claude Design mockup used "Nível" here, which would collide.
export const characterListLabels: Record<Locale, CharacterListLabels> = {
  en: {
    title: 'My Characters',
    subtitle: 'Saved Cypher System characters',
    newCharacter: 'New Character',
    tier: 'Tier',
    updateBadge: 'Rules Update',
    emptyTitle: 'No characters yet.',
    emptyBody: 'Build your first character to get started — it takes about ten minutes.',
  },
  'pt-br': {
    title: 'Meus Personagens',
    subtitle: 'Personagens salvos do Cypher System',
    newCharacter: 'Novo Personagem',
    tier: 'Grau',
    updateBadge: 'Atualização de Regras',
    emptyTitle: 'Nenhum personagem ainda.',
    emptyBody: 'Crie seu primeiro personagem para começar — leva cerca de dez minutos.',
  },
}

export const signOutLabel: Record<Locale, string> = {
  en: 'Sign out',
  'pt-br': 'Sair',
}
