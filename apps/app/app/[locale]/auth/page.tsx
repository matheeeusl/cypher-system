import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { AuthScreen } from '@/components/auth/AuthScreen'
import { AppShell } from '@/components/AppShell'
import { isLocale, locales } from '@/lib/i18n/auth'
import { metaCopy } from '@/lib/i18n/meta'
import { safeNextPath } from '@/lib/redirect'
import { getSession } from '@/lib/session'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// The app's one indexable page (app/[locale]/layout.tsx keeps the rest out):
// what a search for the character builder should land on. The canonical drops
// the ?next= redirect parameter, and hreflang pairs the two languages.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const copy = metaCopy[isLocale(locale) ? locale : 'en']
  return {
    title: copy.signInTitle,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${locale}/auth`,
      languages: { en: '/en/auth', 'pt-BR': '/pt-br/auth', 'x-default': '/en/auth' },
    },
    openGraph: {
      siteName: 'Cypher System',
      type: 'website',
      title: copy.siteTitle,
      description: copy.description,
      locale: copy.ogLocale,
      url: `/${locale}/auth`,
    },
  }
}

export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const next = safeNextPath((await searchParams).next, `/${locale}`)
  if (await getSession()) redirect(next)

  return (
    <AppShell
      locale={locale}
      section="ACCOUNT"
      signedIn={false}
      switchLocaleHref={`/${locale === 'en' ? 'pt-br' : 'en'}/auth`}
    >
      <AuthScreen locale={locale} next={next} />
    </AppShell>
  )
}
