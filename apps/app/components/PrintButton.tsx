'use client'

import { Button } from '@cypher/ui'

/** "Export as PDF": opens the browser's print dialog, whose "Save as PDF" does the rest. */
export function PrintButton({ label }: { label: string }) {
  return <Button label={label} onClick={() => window.print()} />
}
