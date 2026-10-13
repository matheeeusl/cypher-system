import { notFound, redirect } from 'next/navigation'

import { Wizard } from '@/components/wizard/Wizard'
import { isLocale } from '@/lib/i18n/auth'
import { getSession } from '@/lib/session'

export default async function NewCharacterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const session = await getSession()
  if (!session) redirect(`/${locale}/auth`)

  // The wizard UI is English-only for now; the locale only drives the links.
  return <Wizard userName={session.user.name} locale={locale} />
}
