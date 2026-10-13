import { Resend } from 'resend'

import { isLocale, type Locale } from '@/lib/i18n/auth'

const resend = new Resend(process.env.RESEND_API_KEY)

// EMAIL_FROM may be a bare address or a full "Name <address>" string.
function fromAddress(): string {
  const from = process.env.EMAIL_FROM ?? ''
  return from.includes('<') ? from : `Cypher System <${from}>`
}

/**
 * Better Auth builds links as `<api>/…?callbackURL=/<locale>/…`, so the page
 * the user was on (and therefore their language) travels inside the URL.
 */
export function localeFromAuthUrl(url: string): Locale {
  const callback = new URL(url).searchParams.get('callbackURL') ?? ''
  const segment = callback.split('/')[1] ?? ''
  return isLocale(segment) ? segment : 'en'
}

const copy: Record<
  Locale,
  Record<
    'verify' | 'reset',
    { subject: string; heading: string; body: string; button: string; ignore: string }
  >
> = {
  en: {
    verify: {
      subject: 'Verify your email — Cypher System',
      heading: 'Verify your email',
      body: 'Confirm your email address to finish creating your account.',
      button: 'Verify email',
      ignore: "If you didn't create an account, you can ignore this email.",
    },
    reset: {
      subject: 'Reset your password — Cypher System',
      heading: 'Reset your password',
      body: 'We received a request to reset your password. This link expires in 1 hour.',
      button: 'Choose a new password',
      ignore: "If you didn't request this, you can ignore this email.",
    },
  },
  'pt-br': {
    verify: {
      subject: 'Confirme seu e-mail — Cypher System',
      heading: 'Confirme seu e-mail',
      body: 'Confirme seu endereço de e-mail para concluir a criação da conta.',
      button: 'Confirmar e-mail',
      ignore: 'Se você não criou uma conta, ignore este e-mail.',
    },
    reset: {
      subject: 'Redefina sua senha — Cypher System',
      heading: 'Redefina sua senha',
      body: 'Recebemos um pedido para redefinir sua senha. Este link expira em 1 hora.',
      button: 'Escolher nova senha',
      ignore: 'Se você não fez esse pedido, ignore este e-mail.',
    },
  },
}

function render(c: (typeof copy)['en']['verify'], url: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;background:#14181c;padding:32px">
  <div style="max-width:440px;margin:0 auto;background:#232b31;border:1px solid #2b333a;border-radius:6px;padding:28px;color:#d8e3e7">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#4fb8b0;margin-bottom:8px">Cypher System</div>
    <h1 style="font-size:22px;margin:0 0 12px">${c.heading}</h1>
    <p style="font-size:14px;line-height:1.55;color:#d8e3e7;margin:0 0 20px">${c.body}</p>
    <a href="${url}" style="display:inline-block;background:#4fb8b0;color:#14181c;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;padding:11px 18px;border-radius:4px;text-decoration:none">${c.button}</a>
    <p style="font-size:12px;color:#7c8a90;margin:20px 0 0">${c.ignore}</p>
  </div>
</div>`
}

export async function sendAuthEmail(kind: 'verify' | 'reset', to: string, url: string) {
  const c = copy[localeFromAuthUrl(url)][kind]
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject: c.subject,
    html: render(c, url),
  })
  if (error) console.error(`[auth] failed to send ${kind} email:`, error)
}
