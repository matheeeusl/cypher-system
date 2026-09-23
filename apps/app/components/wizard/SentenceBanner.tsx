import type { WizardDescriptor, WizardFocus, WizardType } from '@/lib/graphql/queries'

interface SentenceBannerProps {
  type?: WizardType | undefined
  descriptor?: WizardDescriptor | undefined
  focus?: WizardFocus | undefined
}

export function SentenceBanner({ type, descriptor, focus }: SentenceBannerProps) {
  const descName = descriptor?.name.en
  const article = descName && /^[aeiou]/i.test(descName) ? 'an' : 'a'
  const descText = descName ? `${article} ${descName}` : 'an adjective'
  const typeText = type?.name.en ?? 'a noun'
  const focusName = focus?.name.en
  const focusText = focusName ? focusName.charAt(0).toLowerCase() + focusName.slice(1) : 'a verb'

  return (
    <div className="border-border bg-panel mt-5 rounded border px-6 py-4 text-center">
      <span className="font-display text-text text-xl font-semibold">
        I am{' '}
        <span className={descriptor ? 'text-accent' : 'text-text-muted italic'}>{descText}</span>{' '}
        <span className={type ? 'text-accent' : 'text-text-muted italic'}>{typeText}</span> who{' '}
        <span className={focus ? 'text-accent' : 'text-text-muted italic'}>{focusText}</span>.
      </span>
    </div>
  )
}
