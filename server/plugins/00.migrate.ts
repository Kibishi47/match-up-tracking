import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { useDb } from '../db'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

export default defineNitroPlugin(async () => {
  // Ne pas bloquer si désactivé explicitement
  if (process.env.SKIP_MIGRATIONS === 'true') return

  let migrationsFolder = path.resolve(process.cwd(), 'server/db/migrations')
  if (!fs.existsSync(migrationsFolder)) {
    migrationsFolder = path.resolve(process.cwd(), '.output/server/db/migrations')
  }

  if (!fs.existsSync(migrationsFolder)) {
    console.warn('⚠️ [DB] Dossier migrations non trouvé à :', migrationsFolder)
    return
  }

  const maxRetries = 10
  const retryDelayMs = 2500

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [DB] Vérification des migrations (tentative ${attempt}/${maxRetries})...`)
      const db = useDb()
      await migrate(db, { migrationsFolder })
      console.log('✅ [DB] Migrations synchronisées avec succès !')
      return
    } catch (error: any) {
      console.error(`❌ [DB] Échec tentative ${attempt}/${maxRetries} :`, error?.message || error)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs))
      } else {
        console.error('💥 [DB] Abandon des migrations automatiques après 10 tentatives.')
      }
    }
  }
})
