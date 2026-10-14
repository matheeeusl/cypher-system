/**
 * Accepts only same-site paths for the post-login `?next=` redirect, so a
 * crafted link can't bounce a freshly signed-in user to another origin
 * (an open redirect). `//evil.com` and `/\evil.com` are rejected because
 * browsers treat both as protocol-relative URLs.
 */
export function safeNextPath(value: string | undefined, fallback: string): string {
  if (!value || !value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}

/** `/<locale>/auth` with the page to return to after signing in. */
export function authHref(locale: string, next: string): string {
  return `/${locale}/auth?next=${encodeURIComponent(next)}`
}
