import { and, asc, desc, eq } from 'drizzle-orm'
import { useDb, metas } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const query = getQuery(event)
  const gameId = query.gameId ? String(query.gameId) : undefined

  const db = useDb()

  const conditions = [eq(metas.userId, user.id)]
  if (gameId) {
    conditions.push(eq(metas.gameId, gameId))
  }

  const results = await db
    .select()
    .from(metas)
    .where(and(...conditions))
    .orderBy(asc(metas.position), desc(metas.createdAt))

  return results
})
