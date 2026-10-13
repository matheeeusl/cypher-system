import { request, type FullConfig } from '@playwright/test'
import { Pool } from 'pg'

export const STORAGE_STATE = 'e2e/.auth/state.json'

/**
 * Creates a throwaway verified user, signs in once, and saves the session so
 * every test starts logged in. Returns the teardown (deletes the user, which
 * cascades to their characters). Needs DATABASE_URL (from .env.local) and a
 * running app; the webServer is already up by the time this runs.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3000'
  const email = `delivered+e2e${Date.now()}@resend.dev` // Resend's "delivered" test inbox
  const password = 'e2e-password-123'
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const api = await request.newContext({ baseURL, extraHTTPHeaders: { origin: baseURL } })
  const signUp = await api.post('/api/auth/sign-up/email', {
    data: { name: 'E2E Tester', email, password },
  })
  if (!signUp.ok()) throw new Error(`e2e sign-up failed: ${signUp.status()}`)

  // Email verification is required to sign in; skip the inbox round trip.
  await pool.query('update "user" set "emailVerified" = true where email = $1', [email])

  const signIn = await api.post('/api/auth/sign-in/email', { data: { email, password } })
  if (!signIn.ok()) throw new Error(`e2e sign-in failed: ${signIn.status()}`)
  await api.storageState({ path: STORAGE_STATE })
  await api.dispose()

  return async () => {
    await pool.query('delete from "user" where email = $1', [email])
    await pool.end()
  }
}
