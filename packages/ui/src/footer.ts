/**
 * Data behind the site footer, shared by the Astro docs and the Next.js app so the two
 * can't drift apart. Kept apart from the React components, like brand.ts, so the docs
 * can import it through `@cypher/ui/footer` without pulling in the component barrel.
 */
export const COPYRIGHT_HOLDER = 'Matheus Laureano'

export const KOFI_URL = 'https://ko-fi.com/mlaureano'

/** A random (EVP) Pix key: made to be shared, so it's fine for it to be public. */
export const PIX_KEY = '235f786e-6853-495f-a30a-59b228e4472e'

export type FooterLocale = 'en' | 'pt-br'

export interface FooterLabels {
  /** Text after "© {year}"; the holder's name comes from COPYRIGHT_HOLDER. */
  rights: string
  /** The en footer links straight to Ko-fi with this text. */
  kofi: string
  /**
   * Pix is Brazil-only, so only pt-br has it. When present, the footer shows one
   * `trigger` that opens a panel with the Pix QR Code, a Ko-fi button and a
   * copy-key button, instead of the direct Ko-fi link.
   */
  pix?: { trigger: string; kofi: string; copy: string; copied: string }
}

export const FOOTER_LABELS: Record<FooterLocale, FooterLabels> = {
  en: {
    rights: 'All rights reserved.',
    kofi: 'Buy me a coffee',
  },
  'pt-br': {
    rights: 'Todos os direitos reservados.',
    kofi: 'Me pague um café',
    pix: {
      trigger: 'Ajude com o café',
      kofi: 'Apoiar no Ko-fi',
      copy: 'Copiar chave Pix',
      copied: 'Chave copiada!',
    },
  },
}
