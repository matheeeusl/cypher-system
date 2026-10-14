import type { Locale } from '@/lib/i18n/auth'

export interface BrandMenuCopy {
  /** Accessible name of the menu button (its visible text is the brand prefix). */
  menu: string
  characters: string
  newCharacter: string
  docs: string
}

export const brandMenuCopy: Record<Locale, BrandMenuCopy> = {
  en: {
    menu: 'Main menu',
    characters: 'My Characters',
    newCharacter: 'New Character',
    docs: 'Docs',
  },
  'pt-br': {
    menu: 'Menu principal',
    characters: 'Meus Personagens',
    newCharacter: 'Novo Personagem',
    docs: 'Documentação',
  },
}
