'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  CharacterList,
  ConfirmDialog,
  type CharacterListLabels,
  type CharacterSummary,
} from '@cypher/ui'

import { deleteCharacter } from '@/app/[locale]/characters/actions'
import type { Locale } from '@/lib/i18n/auth'
import { deleteDialog } from '@/lib/i18n/characters'

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
  const copy = deleteDialog[locale]
  const [pending, setPending] = useState<CharacterSummary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  function close() {
    setPending(null)
    setError(undefined)
  }

  async function confirmDelete() {
    if (!pending) return
    setDeleting(true)
    setError(undefined)
    try {
      const { ok } = await deleteCharacter(pending.id)
      if (ok) {
        close()
        router.refresh()
      } else {
        setError(copy.failed)
      }
    } catch {
      setError(copy.failed)
    }
    setDeleting(false)
  }

  return (
    <>
      <CharacterList
        characters={characters}
        labels={labels}
        newCharacterHref={newCharacterHref}
        onDelete={(id) => setPending(characters.find((c) => c.id === id) ?? null)}
      />
      <ConfirmDialog
        open={pending !== null}
        title={pending ? copy.title(pending.name) : ''}
        description={copy.body}
        confirmLabel={copy.confirm}
        cancelLabel={copy.cancel}
        busyLabel={copy.deleting}
        busy={deleting}
        errorMessage={error}
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={close}
      />
    </>
  )
}
