import { and, eq, ne } from 'drizzle-orm'
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

  const body = await readBody(event)
  if (!body?.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom du jeu est obligatoire'
    })
  }

  const name = body.name.trim()
  const logoUrl = body.logoUrl !== undefined
    ? (typeof body.logoUrl === 'string' && body.logoUrl.trim() !== '' ? body.logoUrl.trim() : null)
    : undefined

  const db = useDb()

  // Vérifier si le nom est utilisé par un autre jeu
  const conflict = await db
    .select()
    .from(games)
    .where(and(eq(games.name, name), ne(games.id, gameId)))
    .limit(1)

  if (conflict.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Un autre jeu utilise déjà le nom "${name}"`
    })
  }

  const [updatedGame] = await db
    .update(games)
    .set({
      name,
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      updatedAt: new Date()
    })
    .where(eq(games.id, gameId))
    .returning()

  if (!updatedGame) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Jeu non trouvé'
    })
  }

  return updatedGame
})
