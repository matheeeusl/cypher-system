import { useWizardI18n } from '@/components/wizard/i18n'

/**
 * Link to a page of the rules reference. Opens in a new tab so a click in the
 * middle of the wizard never costs the user their in-progress character.
 */
export function DocsLink({ href }: { href: string }) {
  const { copy } = useWizardI18n()

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="text-accent hover:text-warning font-mono text-[12px] no-underline print:hidden"
    >
      {copy.viewInReference} ↗
    </a>
  )
}
