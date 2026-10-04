import { eq } from 'drizzle-orm'
import { useDb, games } from '../../../db'
import { requireAdminUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)

  if (!body?.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom du jeu est obligatoire'
    })
  }

  const name = body.name.trim()
  const logoUrl = body.logoUrl && typeof body.logoUrl === 'string'
    ? body.logoUrl.trim()
    : null

  const db = useDb()

  // Vérifier si un jeu avec le même nom existe déjà
  const existing = await db
    .select()
    .from(games)
    .where(eq(games.name, name))
    .limit(1)

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Un jeu avec le nom "${name}" existe déjà`
    })
  }

  const [newGame] = await db
    .insert(games)
    .values({
      name,
      logoUrl
    })
    .returning()

  return newGame
})
