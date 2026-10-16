'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@cypher/ui'

import { authClient } from '@/lib/auth-client'

export function UserMenu({
  name,
  signOutLabel = 'Sign out',
}: {
  name: string
  signOutLabel?: string
}) {
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    router.replace('/')
    router.refresh()
  }

  return (
    // Stacked (name above a full-width button) below `sm`, where it only appears
    // inside MobileHeaderMenu's narrow popup; a single row in the desktop bar.
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-text max-w-40 truncate font-mono text-[12px]" title={name}>
        {name}
      </span>
      <Button label={signOutLabel} variant="ghost" onClick={() => void signOut()} />
    </div>
  )
}
