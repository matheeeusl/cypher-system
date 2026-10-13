import { notFound, redirect } from 'next/navigation'

import { Alert } from '@cypher/ui'

import { AppShell } from '@/components/AppShell'
import { UserMenu } from '@/components/auth/UserMenu'
import { PlayScreen } from '@/components/play/PlayScreen'
import { loadDerived } from '@/lib/character-derived'
import { getCharacter } from '@/lib/characters'
import { isLocale } from '@/lib/i18n/auth'
import { signOutLabel } from '@/lib/i18n/characters'
import { playCopy } from '@/lib/i18n/play'
import { sheetCopy } from '@/lib/i18n/sheet'
import { getPlayData, setPoolMax } from '@/lib/play'
import { buildPlayView, type PlayView } from '@/lib/play-view'
import { getSession } from '@/lib/session'

export default async function PlayPage({
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

  const copy = playCopy[locale]
  const sheet = sheetCopy[locale]

  let view: PlayView | null = null
  let unavailable = false
  try {
    const [bundle, play] = await Promise.all([
      loadDerived(character),
      getPlayData(session.user.id, id),
    ])
    if (bundle && play) {
      view = await buildPlayView(character, bundle, play, locale)
      // Keep the cached maximums (used by the Pool buttons) in step with the engine.
      const max = { might: 0, speed: 0, intellect: 0 }
      for (const p of view.pools) max[p.key] = p.max
      const cached = character.poolMax
      if (
        !cached ||
        cached.might !== max.might ||
        cached.speed !== max.speed ||
        cached.intellect !== max.intellect
      ) {
        await setPoolMax(session.user.id, id, max)
      }
    }
  } catch (err) {
    console.error('[play] failed to load:', err)
    unavailable = true
  }

  return (
    <AppShell
      locale={locale}
      title={`${copy.title} · ${character.name}`}
      switchLocaleHref={`/${locale === 'en' ? 'pt-br' : 'en'}/characters/${id}/play`}
      actions={<UserMenu name={session.user.name} signOutLabel={signOutLabel[locale]} />}
    >
      <div className="mx-auto w-full max-w-195">
        <a
          href={`/${locale}/characters/${id}`}
          className="text-accent hover:text-warning mb-4 inline-block cursor-pointer font-mono text-xs transition-colors"
        >
          {copy.backToSheet}
        </a>
      </div>
      {view ? (
        <PlayScreen locale={locale} initial={view} />
      ) : (
        <div className="mx-auto w-full max-w-195">
          <Alert
            variant={unavailable ? 'error' : 'warning'}
            title={unavailable ? undefined : sheet.invalidTitle}
          >
            {unavailable ? sheet.unavailable : sheet.invalidBody}
          </Alert>
        </div>
      )}
    </AppShell>
  )
}
