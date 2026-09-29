import { and, eq, ne } from 'drizzle-orm'
import { useDb, games } from '../../../../database'
import { requireAdminUser } from '../../../../utils/auth'
import { slugify } from '../../../../utils/slug'

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

  const body = await readBody(event)
  if (!body?.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom du jeu est obligatoire'
    })
  }

  const name = body.name.trim()
  const slug = (body.slug && typeof body.slug === 'string' && body.slug.trim())
    ? slugify(body.slug)
    : slugify(name)

  const logoUrl = body.logoUrl !== undefined
    ? (typeof body.logoUrl === 'string' && body.logoUrl.trim() !== '' ? body.logoUrl.trim() : null)
    : undefined

  const db = useDb()

  // Vérifier si le slug est utilisé par un autre jeu
  const conflict = await db
    .select()
    .from(games)
    .where(and(eq(games.slug, slug), ne(games.id, gameId)))
    .limit(1)

  if (conflict.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Un autre jeu utilise déjà le slug "${slug}"`
    })
  }

  const [updatedGame] = await db
    .update(games)
    .set({
      name,
      slug,
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
