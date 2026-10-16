import type { Metadata } from 'next'

import { isLocale } from '@/lib/i18n/auth'
import { metaCopy } from '@/lib/i18n/meta'

/**
 * Localized metadata for every /{locale} route. Kept out of search results by
 * default: these pages are a signed-in user's characters (or a password-reset
 * link), so a new route stays unindexed unless its page opts in — only the
 * sign-in page does (app/[locale]/auth/page.tsx). The rules content people
 * search for lives on the docs site, which links here.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const copy = metaCopy[isLocale(locale) ? locale : 'en']
  return {
    // The root layout's template still applies to this default, so it's the
    // short name ("Criação de Personagem" -> "Criação de Personagem · Cypher System").
    title: { default: copy.appName, template: '%s · Cypher System' },
    description: copy.description,
    // Metadata merges shallowly: this replaces the root layout's openGraph
    // whole, so its fields are repeated.
    openGraph: {
      siteName: 'Cypher System',
      type: 'website',
      title: copy.siteTitle,
      description: copy.description,
      locale: copy.ogLocale,
    },
    robots: { index: false, follow: false },
  }
}

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return children
}
