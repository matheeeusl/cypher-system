import { notFound, redirect } from 'next/navigation'

import { AuthScreen } from '@/components/auth/AuthScreen'
import { AppShell } from '@/components/AppShell'
import { isLocale, locales } from '@/lib/i18n/auth'
import { getSession } from '@/lib/session'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function AuthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  if (await getSession()) redirect(`/${locale}`)

  return (
    <AppShell
      locale={locale}
      section="ACCOUNT"
      switchLocaleHref={`/${locale === 'en' ? 'pt-br' : 'en'}/auth`}
    >
      <AuthScreen locale={locale} />
    </AppShell>
  )
}
