import { notFound } from 'next/navigation'

import { AppShell } from '@/components/AppShell'
import { ResetPasswordScreen } from '@/components/auth/ResetPasswordScreen'
import { isLocale } from '@/lib/i18n/auth'

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale } = await params
  const { token } = await searchParams
  if (!isLocale(locale)) notFound()

  return (
    <AppShell
      locale={locale}
      section="ACCOUNT"
      switchLocaleHref={`/${locale === 'en' ? 'pt-br' : 'en'}/auth`}
    >
      <ResetPasswordScreen locale={locale} token={token} />
    </AppShell>
  )
}
