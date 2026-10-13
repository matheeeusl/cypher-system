import { Pool } from 'pg'

// One pool per server process. In dev, hot reloads re-evaluate this module,
// so the pool is parked on globalThis to avoid leaking connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool }

export const pool = (globalForDb.pgPool ??= new Pool({
  connectionString: process.env.DATABASE_URL,
}))
