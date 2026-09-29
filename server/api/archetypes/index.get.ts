import { and, asc, eq } from 'drizzle-orm'
import { useDb, archetypes } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const query = getQuery(event)
  const gameId = query.gameId ? String(query.gameId) : undefined
  const metaId = query.metaId ? String(query.metaId) : undefined
  const includeArchived = query.includeArchived === 'true'

  const db = useDb()

  const conditions = [eq(archetypes.userId, user.id)]
  if (gameId) {
    conditions.push(eq(archetypes.gameId, gameId))
  }
  if (metaId) {
    conditions.push(eq(archetypes.metaId, metaId))
  }
  if (!includeArchived) {
    conditions.push(eq(archetypes.isArchived, false))
  }

  const results = await db
    .select()
    .from(archetypes)
    .where(and(...conditions))
    .orderBy(asc(archetypes.name))

  return results
})
