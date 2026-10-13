import { notFound, redirect } from 'next/navigation'

import { CharacterList, type CharacterSummary } from '@cypher/ui'

import { AppShell } from '@/components/AppShell'
import { UserMenu } from '@/components/auth/UserMenu'
import { isLocale, locales } from '@/lib/i18n/auth'
import { characterListLabels, signOutLabel } from '@/lib/i18n/characters'
import { getSession } from '@/lib/session'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function MyCharactersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const session = await getSession()
  if (!session) redirect(`/${locale}/auth`)

  // Characters can't be saved yet (the wizard's Save button is "coming soon"),
  // so the list is always empty until persistence lands.
  const characters: CharacterSummary[] = []

  return (
    <AppShell
      locale={locale}
      title="CYPHER://CHARACTERS"
      switchLocaleHref={`/${locale === 'en' ? 'pt-br' : 'en'}`}
      actions={<UserMenu name={session.user.name} signOutLabel={signOutLabel[locale]} />}
    >
      <CharacterList
        characters={characters}
        labels={characterListLabels[locale]}
        newCharacterHref={`/${locale}/characters/new`}
      />
    </AppShell>
  )
}
