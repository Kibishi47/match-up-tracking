import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { useDb } from '../database'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

export default defineNitroPlugin(async () => {
  // Ne pas bloquer si désactivé explicitement
  if (process.env.SKIP_MIGRATIONS === 'true') return

  try {
    const db = useDb()
    // Trouver le dossier migrations soit en dev soit dans le build
    let migrationsFolder = path.resolve(process.cwd(), 'server/database/migrations')
    if (!fs.existsSync(migrationsFolder)) {
      migrationsFolder = path.resolve(process.cwd(), '.output/server/database/migrations')
    }

    if (fs.existsSync(migrationsFolder)) {
      console.log('🔄 [DB] Vérification et application des migrations automatiques...')
      await migrate(db, { migrationsFolder })
      console.log('✅ [DB] Migrations synchronisées avec succès !')
    } else {
      console.warn('⚠️ [DB] Dossier migrations non trouvé à :', migrationsFolder)
    }
  } catch (error: any) {
    console.error('❌ [DB] Erreur lors de l’application des migrations :', error?.message || error)
  }
})
