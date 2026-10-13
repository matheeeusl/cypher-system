import { notFound, redirect } from 'next/navigation'

import type { CharacterSummary } from '@cypher/ui'

import { AppShell } from '@/components/AppShell'
import { CharacterListScreen } from '@/components/CharacterListScreen'
import { UserMenu } from '@/components/auth/UserMenu'
import { listCharacters } from '@/lib/characters'
import { timeAgo } from '@/lib/format'
import { fetchContentVersions, isStale, type ContentVersions } from '@/lib/graphql/versions'
import { isLocale, locales, type Locale } from '@/lib/i18n/auth'
import { characterListLabels, signOutLabel, updatedPrefix } from '@/lib/i18n/characters'
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

  const saved = await listCharacters(session.user.id)

  // Staleness is best-effort: if the rules API is down the list still renders,
  // just without the "Rules Update" badges.
  let versions: ContentVersions = new Map()
  try {
    versions = await fetchContentVersions()
  } catch {}

  const characters: CharacterSummary[] = saved.map((c) => ({
    id: c.id,
    name: c.name,
    tier: c.summary.tier,
    descriptor: localized(c.summary.descriptorName, locale),
    type: localized(c.summary.typeName, locale),
    focus: localized(c.summary.focusName, locale),
    updatedLabel: `${updatedPrefix[locale]} ${timeAgo(c.updatedAt, locale)}`,
    stale: isStale(c.contentVersions, versions),
    href: `/${locale}/characters/${c.id}`,
  }))

  return (
    <AppShell
      locale={locale}
      section="CHARACTERS"
      switchLocaleHref={`/${locale === 'en' ? 'pt-br' : 'en'}`}
      actions={<UserMenu name={session.user.name} signOutLabel={signOutLabel[locale]} />}
    >
      <CharacterListScreen
        locale={locale}
        characters={characters}
        labels={characterListLabels[locale]}
        newCharacterHref={`/${locale}/characters/new`}
      />
    </AppShell>
  )
}

function localized(value: { en: string; ptBR: string }, locale: Locale): string {
  return locale === 'pt-br' ? value.ptBR : value.en
}
