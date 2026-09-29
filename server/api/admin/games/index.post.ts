import { eq } from 'drizzle-orm'
import { useDb, games } from '../../../database'
import { requireAdminUser } from '../../../utils/auth'
import { slugify } from '../../../utils/slug'

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
  const slug = (body.slug && typeof body.slug === 'string' && body.slug.trim())
    ? slugify(body.slug)
    : slugify(name)

  const logoUrl = body.logoUrl && typeof body.logoUrl === 'string'
    ? body.logoUrl.trim()
    : null

  const db = useDb()

  // Vérifier si le slug existe déjà
  const existing = await db
    .select()
    .from(games)
    .where(eq(games.slug, slug))
    .limit(1)

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Un jeu avec l'identifiant slug "${slug}" existe déjà`
    })
  }

  const [newGame] = await db
    .insert(games)
    .values({
      name,
      slug,
      logoUrl
    })
    .returning()

  return newGame
})
