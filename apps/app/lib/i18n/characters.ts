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
    delete: 'Delete',
  },
  'pt-br': {
    title: 'Meus Personagens',
    subtitle: 'Personagens salvos do Cypher System',
    newCharacter: 'Novo Personagem',
    tier: 'Grau',
    updateBadge: 'Atualização de Regras',
    emptyTitle: 'Nenhum personagem ainda.',
    emptyBody: 'Crie seu primeiro personagem para começar — leva cerca de dez minutos.',
    delete: 'Excluir',
  },
}

export const signOutLabel: Record<Locale, string> = {
  en: 'Sign out',
  'pt-br': 'Sair',
}

export const updatedPrefix: Record<Locale, string> = {
  en: 'Updated',
  'pt-br': 'Atualizado',
}

export const deleteConfirm: Record<Locale, (name: string) => string> = {
  en: (name) => `Delete "${name}"? This can't be undone.`,
  'pt-br': (name) => `Excluir "${name}"? Esta ação não pode ser desfeita.`,
}

export const deleteFailed: Record<Locale, string> = {
  en: 'Could not delete the character. Please try again.',
  'pt-br': 'Não foi possível excluir o personagem. Tente novamente.',
}
