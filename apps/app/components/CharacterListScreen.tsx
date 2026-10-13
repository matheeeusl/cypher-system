'use client'

import { useRouter } from 'next/navigation'

import { CharacterList, type CharacterListLabels, type CharacterSummary } from '@cypher/ui'

import { deleteCharacter } from '@/app/[locale]/characters/actions'
import { deleteConfirm, deleteFailed } from '@/lib/i18n/characters'
import type { Locale } from '@/lib/i18n/auth'

interface CharacterListScreenProps {
  locale: Locale
  characters: CharacterSummary[]
  labels: CharacterListLabels
  newCharacterHref: string
}

export function CharacterListScreen({
  locale,
  characters,
  labels,
  newCharacterHref,
}: CharacterListScreenProps) {
  const router = useRouter()

  async function handleDelete(id: string) {
    const character = characters.find((c) => c.id === id)
    if (!character || !window.confirm(deleteConfirm[locale](character.name))) return

    const { ok } = await deleteCharacter(id)
    if (ok) router.refresh()
    else window.alert(deleteFailed[locale])
  }

  return (
    <CharacterList
      characters={characters}
      labels={labels}
      newCharacterHref={newCharacterHref}
      onDelete={(id) => void handleDelete(id)}
    />
  )
}
