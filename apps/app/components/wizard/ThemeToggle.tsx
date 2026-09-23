'use client'

import { useEffect, useState } from 'react'

import { Button } from '@cypher/ui'

type Mode = 'dark' | 'light'

function readStoredMode(): Mode {
  try {
    return window.localStorage.getItem('cypher-theme') === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('dark')

  // Runs once on mount: applies the stored preference to the DOM and to
  // state together. Deliberately not a lazy useState initializer — that
  // would run during the client's hydration render too, before it can see
  // what the server actually sent, and produce a mismatch.
  useEffect(() => {
    const stored = readStoredMode()
    document.documentElement.setAttribute('data-theme', stored)
    // react-hooks/set-state-in-effect wants every effect setState to happen
    // inside an async/subscription callback — but this one IS the sync read
    // of an external system (localStorage) that can only happen post-mount;
    // there's no callback to defer into.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(stored)
  }, [])

  function toggle() {
    const next: Mode = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      window.localStorage.setItem('cypher-theme', next)
    } catch {
      // Theme just won't persist across reloads in this browser — fine.
    }
  }

  return <Button label={mode === 'dark' ? '● DARK' : '○ LIGHT'} variant="ghost" onClick={toggle} />
}
