import { and, eq } from 'drizzle-orm'
import { useDb, userGames } from '../../database'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const gameId = parseInt(body?.gameId, 10)
  const isSelected = Boolean(body?.selected)

  if (isNaN(gameId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'gameId invalide'
    })
  }

  const db = useDb()

  if (isSelected) {
    // Insérer si non existant (ignorer conflit)
    await db
      .insert(userGames)
      .values({
        userId: user.id,
        gameId
      })
      .onConflictDoNothing()
  } else {
    // Supprimer
    await db
      .delete(userGames)
      .where(and(eq(userGames.userId, user.id), eq(userGames.gameId, gameId)))
  }

  return { success: true, gameId, selected: isSelected }
})
