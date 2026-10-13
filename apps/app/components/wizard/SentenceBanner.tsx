import type { WizardDescriptor, WizardFocus, WizardType } from '@/lib/graphql/queries'

import { useWizardI18n } from './i18n'

interface SentenceBannerProps {
  type?: WizardType | undefined
  descriptor?: WizardDescriptor | undefined
  focus?: WizardFocus | undefined
}

export function SentenceBanner({ type, descriptor, focus }: SentenceBannerProps) {
  const { copy, t } = useWizardI18n()
  const { sentence } = copy

  const descText = descriptor ? sentence.describe(t(descriptor.name)) : sentence.adjective
  const typeText = type ? t(type.name) : sentence.noun
  const focusName = focus ? t(focus.name) : undefined
  const focusText = focusName
    ? focusName.charAt(0).toLowerCase() + focusName.slice(1)
    : sentence.verb

  return (
    <div className="border-border bg-panel mt-5 rounded border px-6 py-4 text-center">
      <span className="font-display text-text text-xl font-semibold">
        {sentence.iAm}{' '}
        <span className={descriptor ? 'text-accent' : 'text-text-muted italic'}>{descText}</span>{' '}
        <span className={type ? 'text-accent' : 'text-text-muted italic'}>{typeText}</span>{' '}
        {sentence.who}{' '}
        <span className={focus ? 'text-accent' : 'text-text-muted italic'}>{focusText}</span>.
      </span>
    </div>
  )
}
