import { notFound, redirect } from 'next/navigation'

import { Alert, CharacterSheet, LinkButton, type CharacterSheetData } from '@cypher/ui'

import { AppShell } from '@/components/AppShell'
import { UserMenu } from '@/components/auth/UserMenu'
import { PrintButton } from '@/components/PrintButton'
import { getCharacter } from '@/lib/characters'
import { getPlayData, type PlayData } from '@/lib/play'
import { buildCharacterSheet } from '@/lib/character-sheet'
import { fetchContentVersions, isStale, type ContentVersions } from '@/lib/graphql/versions'
import { isLocale } from '@/lib/i18n/auth'
import { signOutLabel } from '@/lib/i18n/characters'
import { sheetCopy } from '@/lib/i18n/sheet'
import { getSession } from '@/lib/session'

export default async function CharacterSheetPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  if (!isLocale(locale)) notFound()

  const session = await getSession()
  if (!session) redirect(`/${locale}/auth`)

  // Malformed ids make Postgres' uuid cast throw; treat them as "not found".
  const character = /^[0-9a-f-]{36}$/i.test(id) ? await getCharacter(session.user.id, id) : null
  if (!character) notFound()

  const copy = sheetCopy[locale]
  const editHref = `/${locale}/characters/${character.id}/edit`

  let sheet: CharacterSheetData | null = null
  let play: PlayData | null = null
  let versions: ContentVersions = new Map()
  let unavailable = false
  try {
    play = await getPlayData(session.user.id, character.id)
    ;[sheet, versions] = await Promise.all([
      buildCharacterSheet(character, locale, play),
      fetchContentVersions(),
    ])
  } catch (err) {
    console.error('[sheet] rules service failed:', err)
    unavailable = true
  }

  return (
    <AppShell
      locale={locale}
      section="CHARACTER"
      switchLocaleHref={`/${locale === 'en' ? 'pt-br' : 'en'}/characters/${character.id}`}
      actions={<UserMenu name={session.user.name} signOutLabel={signOutLabel[locale]} />}
    >
      <div className="mx-auto w-full max-w-200">
        <a
          href={`/${locale}`}
          className="text-accent hover:text-warning mb-4 inline-block cursor-pointer font-mono text-xs transition-colors print:hidden"
        >
          {copy.backToList}
        </a>

        {isStale(character.contentVersions, versions) && (
          <div className="mb-4 print:hidden">
            <Alert variant="warning">{copy.staleBanner}</Alert>
          </div>
        )}

        {sheet ? (
          <CharacterSheet
            sheet={sheet}
            labels={copy.labels}
            printDate={`${copy.printed} ${new Date().toLocaleDateString(locale)}`}
            actions={
              <>
                <LinkButton href={`/${locale}/characters/${character.id}/play`} label={copy.play} />
                <LinkButton href={editHref} label={copy.edit} variant="ghost" />
                <PrintButton label={copy.exportPdf} />
              </>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            <Alert
              variant={unavailable ? 'error' : 'warning'}
              title={unavailable ? undefined : copy.invalidTitle}
            >
              {unavailable ? copy.unavailable : copy.invalidBody}
            </Alert>
            {!unavailable && (
              <div>
                <LinkButton href={editHref} label={copy.edit} />
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
