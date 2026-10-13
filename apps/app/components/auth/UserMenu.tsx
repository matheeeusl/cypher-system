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
    <div className="flex items-center gap-3">
      <span className="text-text max-w-40 truncate font-mono text-[12px]" title={name}>
        {name}
      </span>
      <Button label={signOutLabel} variant="ghost" onClick={() => void signOut()} />
    </div>
  )
}
