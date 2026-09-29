import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matchup_tracking'
  console.log('Connecting to database for migrations...')
  
  const migrationClient = postgres(connectionString, { max: 1 })
  const db = drizzle(migrationClient)

  console.log('Running Drizzle migrations from server/database/migrations...')
  await migrate(db, { migrationsFolder: './server/database/migrations' })

  console.log('Migrations applied successfully!')
  await migrationClient.end()
  process.exit(0)
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
