'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Collapses header controls that don't fit a phone-width bar (user menu,
 * language switch, …) behind a hamburger button. Hidden entirely at `sm:`
 * and up, where the caller renders the same controls inline instead — see
 * AppShell.tsx and Wizard.tsx.
 */
export function MobileHeaderMenu({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative sm:hidden" ref={rootRef}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="border-border bg-panel text-text-muted flex cursor-pointer items-center rounded border px-2.5 py-1.5"
      >
        ☰
      </button>
      {open && (
        <div
          role="menu"
          className="border-border bg-panel absolute top-full right-0 z-10 mt-2 flex min-w-40 flex-col gap-2 rounded border p-2 shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  )
}
