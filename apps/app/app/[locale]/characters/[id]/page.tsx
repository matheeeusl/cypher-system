import { notFound, redirect } from 'next/navigation'

import { Wizard } from '@/components/wizard/Wizard'
import { getCharacter } from '@/lib/characters'
import { isLocale } from '@/lib/i18n/auth'
import { getSession } from '@/lib/session'

// Until a read-only character sheet exists, a saved character opens in the
// wizard on its Review step (where each section has an Edit button).
export default async function EditCharacterPage({
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

  return (
    <Wizard
      userName={session.user.name}
      backHref={`/${locale}`}
      characterId={character.id}
      initialChoices={character.choices}
    />
  )
}
