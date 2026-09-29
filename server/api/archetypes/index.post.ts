import { useDb, archetypes } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  if (!body?.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: "Le nom de l'archétype est obligatoire"
    })
  }

  const gameId = body?.gameId ? String(body.gameId) : null
  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le jeu associé est obligatoire'
    })
  }

  const metaId = body?.metaId ? String(body.metaId) : null

  const db = useDb()

  const [newArchetype] = await db
    .insert(archetypes)
    .values({
      userId: user.id,
      gameId,
      metaId,
      name: body.name.trim(),
      card1Name: body.card1Name ? String(body.card1Name).trim() : null,
      card1ImageUrl: body.card1ImageUrl ? String(body.card1ImageUrl).trim() : null,
      card2Name: body.card2Name ? String(body.card2Name).trim() : null,
      card2ImageUrl: body.card2ImageUrl ? String(body.card2ImageUrl).trim() : null,
      isArchived: false
    })
    .returning()

  return newArchetype
})
