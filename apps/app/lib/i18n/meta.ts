import type { Locale } from '@/lib/i18n/auth'

// Page titles and descriptions for search results and link previews.
// pt-BR: "Criação de Personagem" / "Monte seu personagem" are what apps/docs'
// home page already uses; Descritor/Tipo/Foco/Reserva are glossary terms;
// "Entrar" is the sign-in button's own label (lib/i18n/auth.ts).
export const metaCopy: Record<
  Locale,
  {
    /** Short name; page titles get " · Cypher System" from the title template. */
    appName: string
    /** Full title, for link previews (og:title) and the root fallback. */
    siteTitle: string
    description: string
    signInTitle: string
    ogLocale: string
  }
> = {
  en: {
    appName: 'Character Builder',
    siteTitle: 'Character Builder · Cypher System',
    description:
      'Build your Cypher System character — Descriptor, Type and Focus — then play it: Pools, XP and advancement, in English and Portuguese.',
    signInTitle: 'Log In',
    ogLocale: 'en_US',
  },
  'pt-br': {
    appName: 'Criação de Personagem',
    siteTitle: 'Criação de Personagem · Cypher System',
    description:
      'Monte seu personagem do Cypher System — Descritor, Tipo e Foco — e jogue com ele: Reservas, XP e avanço, em português e inglês.',
    signInTitle: 'Entrar',
    ogLocale: 'pt_BR',
  },
}
