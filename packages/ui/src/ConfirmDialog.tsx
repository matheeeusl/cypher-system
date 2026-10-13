'use client'

import { useEffect, useRef } from 'react'

import { Alert } from './Alert'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  /** Replaces the confirm label while the action runs; also disables both buttons. */
  busyLabel?: string
  busy?: boolean
  /** Shown inside the dialog when the confirmed action failed. */
  errorMessage?: string | undefined
  /** Styles the confirm button as destructive. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation built on the native <dialog>: the browser provides the
 * focus trap, Escape-to-close and the dimmed backdrop. The parent owns `open`.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busyLabel,
  busy = false,
  errorMessage,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        // Escape: let the parent decide (it may be mid-request).
        e.preventDefault()
        if (!busy) onCancel()
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
      className="border-border bg-panel text-text m-auto w-[calc(100%-2rem)] max-w-105 rounded-md border p-0 backdrop:bg-black/60"
    >
      <div className="px-6.5 py-6">
        <h2 id="confirm-dialog-title" className="font-display mb-2 text-lg font-semibold">
          {title}
        </h2>
        {description && (
          <p className="text-text-muted mb-5 text-sm leading-relaxed whitespace-pre-line">
            {description}
          </p>
        )}
        {errorMessage && (
          <div className="mb-4">
            <Alert variant="error">{errorMessage}</Alert>
          </div>
        )}
        <div className="flex justify-end gap-2.5">
          <Button label={cancelLabel} variant="ghost" disabled={busy} onClick={onCancel} />
          <Button
            label={busy && busyLabel ? busyLabel : confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            disabled={busy}
            onClick={onConfirm}
          />
        </div>
      </div>
    </dialog>
  )
}
