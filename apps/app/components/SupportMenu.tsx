'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { KOFI_URL, PIX_KEY, type FooterLabels } from '@cypher/ui/footer'

type PixLabels = NonNullable<FooterLabels['pix']>

/**
 * pt-br "Ajude com o café": a trigger that opens a panel with the Pix QR Code, a Ko-fi
 * button and a copy-key button. Closes on a click outside or Esc.
 */
export function SupportMenu({ labels }: { labels: PixLabels }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(PIX_KEY)
    } catch {
      // Clipboard blocked (e.g. insecure context): leave the label alone.
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="text-accent cursor-pointer hover:underline"
      >
        ☕ {labels.trigger}
      </button>
      {open && (
        <div className="border-border bg-panel absolute right-0 bottom-full z-10 mb-2 flex w-52 flex-col items-center gap-2 rounded-md border p-3">
          <Image
            src="/pix-key.png"
            alt="QR Code Pix"
            width={168}
            height={168}
            className="mb-1 rounded bg-white p-1"
          />
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border-accent bg-accent-soft text-accent! hover:border-warning w-full rounded border px-3 py-1.5 text-center font-mono text-[11px] no-underline"
          >
            {labels.kofi} ↗
          </a>
          <button
            type="button"
            onClick={copyKey}
            className="border-border bg-bg text-text hover:border-accent w-full cursor-pointer rounded border px-3 py-1.5 font-mono text-[11px]"
          >
            {copied ? labels.copied : labels.copy}
          </button>
        </div>
      )}
    </div>
  )
}
