import { useDb, metas } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  if (!body?.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom de la méta est obligatoire'
    })
  }

  const name = body.name.trim()
  if (name.length > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom de la méta ne peut pas dépasser 100 caractères'
    })
  }

  const gameId = body?.gameId ? String(body.gameId) : null
  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le jeu associé est obligatoire'
    })
  }

  const db = useDb()

  try {
    const [newMeta] = await db
      .insert(metas)
      .values({
        userId: user.id,
        gameId,
        name,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      })
      .returning()

    return newMeta
  } catch (error: any) {
    // Code 23505 = unique violation sur (userId, gameId, name)
    if (error?.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Une méta avec ce nom existe déjà pour ce jeu'
      })
    }
    throw error
  }
})
