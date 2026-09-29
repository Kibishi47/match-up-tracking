import { desc } from 'drizzle-orm'
import { useDb, games } from '../../../database'
import { requireAdminUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const db = useDb()

  const allGames = await db
    .select()
    .from(games)
    .orderBy(desc(games.createdAt))

  return allGames
})
