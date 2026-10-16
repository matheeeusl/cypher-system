'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { BRAND_PREFIX } from '@cypher/ui'

import { docsLinks } from '@/lib/docs-links'
import type { Locale } from '@/lib/i18n/auth'
import { brandMenuCopy } from '@/lib/i18n/brand-menu'

interface AppBrandProps {
  locale: Locale
  /** What follows the brand prefix (which opens the main menu), e.g. "ACCOUNT" → "CYPHER://ACCOUNT". */
  section: string
  /**
   * Signed-out screens show only the docs link: My Characters and New Character
   * would just bounce back to the sign-in page.
   */
  signedIn?: boolean
}

const itemClass =
  'text-text hover:bg-accent-soft hover:text-accent block px-3.5 py-2 font-mono text-[12px] whitespace-nowrap transition-colors'

export function AppBrand({ locale, section, signedIn = true }: AppBrandProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const copy = brandMenuCopy[locale]

  // Only listen while open: close on a click outside the menu or on Escape.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span
      ref={rootRef}
      className="text-text-muted relative font-mono text-[13px] tracking-wider print:hidden"
    >
      <button
        ref={buttonRef}
        type="button"
        // Contains the visible text, so voice control ("click CYPHER") finds it.
        aria-label={`${BRAND_PREFIX} ${copy.menu}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="hover:text-accent cursor-pointer transition-colors"
      >
        {BRAND_PREFIX}
      </button>
      {section}

      {open && (
        <div
          role="menu"
          className="border-border bg-panel absolute top-full left-0 z-10 mt-3 min-w-44 overflow-hidden rounded border py-1 tracking-normal shadow-lg"
        >
          {signedIn && (
            <>
              <Link
                role="menuitem"
                href={`/${locale}`}
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                {copy.characters}
              </Link>
              <Link
                role="menuitem"
                href={`/${locale}/characters/new`}
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                {copy.newCharacter}
              </Link>
            </>
          )}
          {/* Another site, in a new tab: a click mid-wizard never costs the in-progress character. */}
          <a
            role="menuitem"
            href={docsLinks.home(locale)}
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            {copy.docs} ↗
          </a>
        </div>
      )}
    </span>
  )
}
