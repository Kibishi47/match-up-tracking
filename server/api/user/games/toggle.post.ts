import { and, eq } from 'drizzle-orm'
import { useDb, userGames, games } from '../../../db'
import { requireAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const gameId = body?.gameId ? String(body.gameId) : null

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'gameId requis'
    })
  }

  const db = useDb()

  // Vérifier que le jeu existe dans le catalogue
  const existingGame = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)

  if (existingGame.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Jeu introuvable'
    })
  }

  // Vérifier si l'utilisateur a déjà ce jeu dans sa collection
  const existingUserGame = await db
    .select()
    .from(userGames)
    .where(and(eq(userGames.userId, user.id), eq(userGames.gameId, gameId)))
    .limit(1)

  if (existingUserGame.length > 0) {
    // Retirer le jeu de la collection
    await db
      .delete(userGames)
      .where(and(eq(userGames.userId, user.id), eq(userGames.gameId, gameId)))

    return {
      success: true,
      gameId,
      active: false
    }
  } else {
    // Ajouter le jeu à la collection
    await db
      .insert(userGames)
      .values({
        userId: user.id,
        gameId
      })
      .onConflictDoNothing()

    return {
      success: true,
      gameId,
      active: true
    }
  }
})
