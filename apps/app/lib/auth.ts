import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'

import { pool } from '@/lib/db'
import { sendAuthEmail } from '@/lib/email'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  // getSession() runs on every page; with the cookie cache it reads a signed
  // copy of the session from a cookie instead of querying Postgres each time.
  // The trade-off (per Better Auth's docs): a session revoked elsewhere stays
  // usable on this device until the copy expires — at most `maxAge`.
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Not awaited on purpose (timing attacks) — see Better Auth email docs.
    sendResetPassword: async ({ user, url }) => {
      void sendAuthEmail('reset', user.email, url)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendAuthEmail('verify', user.email, url)
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
})
