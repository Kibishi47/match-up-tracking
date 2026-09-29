import { asc } from 'drizzle-orm'
import { useDb, games } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)
  const db = useDb()

  return await db
    .select()
    .from(games)
    .orderBy(asc(games.name))
})
