import { notFound, redirect } from 'next/navigation'

import { AuthScreen } from '@/components/auth/AuthScreen'
import { AppShell } from '@/components/AppShell'
import { isLocale, locales } from '@/lib/i18n/auth'
import { safeNextPath } from '@/lib/redirect'
import { getSession } from '@/lib/session'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
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
      switchLocaleHref={`/${locale === 'en' ? 'pt-br' : 'en'}/auth`}
    >
      <AuthScreen locale={locale} next={next} />
    </AppShell>
  )
}
