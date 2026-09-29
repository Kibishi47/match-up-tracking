import { and, eq } from 'drizzle-orm'
import { useDb, matches } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const matchId = getRouterParam(event, 'id')

  if (!matchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de match requis'
    })
  }

  const db = useDb()

  const [deletedMatch] = await db
    .delete(matches)
    .where(and(eq(matches.id, matchId), eq(matches.userId, user.id)))
    .returning()

  if (!deletedMatch) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Match introuvable ou non autorisé'
    })
  }

  return { success: true, deletedMatch }
})
