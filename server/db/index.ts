import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: PostgresJsDatabase<typeof schema> | null = null

export function useDb() {
  if (_db) return _db

  const config = useRuntimeConfig()
  const connectionString = config.databaseUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matchup_tracking'

  const client = postgres(connectionString, {
    max: process.env.NODE_ENV === 'production' ? 10 : 2,
    idle_timeout: 20,
    connect_timeout: 10
  })

  _db = drizzle(client, { schema })
  return _db
}

export * from './schema'
