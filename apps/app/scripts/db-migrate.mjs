// Applies db/migrations/*.sql in filename order, once each.
// Usage: pnpm --filter @cypher/app db:migrate   (reads DATABASE_URL from .env.local)
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import pg from 'pg'

const dir = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'db', 'migrations')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

try {
  await pool.query(
    'create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())',
  )
  const done = new Set(
    (await pool.query('select name from schema_migrations')).rows.map((r) => r.name),
  )

  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(file)) continue
    const client = await pool.connect()
    try {
      await client.query('begin')
      await client.query(await readFile(join(dir, file), 'utf8'))
      await client.query('insert into schema_migrations (name) values ($1)', [file])
      await client.query('commit')
      console.log(`applied ${file}`)
    } catch (err) {
      await client.query('rollback')
      throw err
    } finally {
      client.release()
    }
  }
  console.log('migrations up to date')
} finally {
  await pool.end()
}
