import { eq } from 'drizzle-orm'
import { useDb, games } from '../../../../database'
import { requireAdminUser } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const idParam = getRouterParam(event, 'id')
  const gameId = parseInt(idParam || '', 10)

  if (isNaN(gameId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de jeu invalide'
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
