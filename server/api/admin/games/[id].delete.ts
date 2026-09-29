import { eq } from 'drizzle-orm'
import { useDb, games } from '../../../db'
import { requireAdminUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const gameId = getRouterParam(event, 'id')

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de jeu requis'
    })
  }

  const db = useDb()

  const [deletedGame] = await db
    .delete(games)
    .where(eq(games.id, gameId))
    .returning()

  if (!deletedGame) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Jeu non trouvé'
    })
  }

  return { success: true, deletedGame }
})
