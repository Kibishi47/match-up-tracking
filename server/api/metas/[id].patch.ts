import { and, eq } from 'drizzle-orm'
import { useDb, metas } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const metaId = getRouterParam(event, 'id')

  if (!metaId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de méta requis'
    })
  }

  const body = await readBody(event)
  const db = useDb()

  const updateData: Record<string, any> = {}

  if (body?.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Le nom de la méta ne peut pas être vide'
      })
    }
    const name = body.name.trim()
    if (name.length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Le nom de la méta ne peut pas dépasser 100 caractères'
      })
    }
    updateData.name = name
  }

  if (body?.isActive !== undefined) {
    updateData.isActive = Boolean(body.isActive)
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucune donnée fournie pour la mise à jour'
    })
  }

  try {
    const [updated] = await db
      .update(metas)
      .set(updateData)
      .where(and(eq(metas.id, metaId), eq(metas.userId, user.id)))
      .returning()

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Méta introuvable ou non autorisée'
      })
    }

    return updated
  } catch (error: any) {
    if (error?.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Une méta avec ce nom existe déjà pour ce jeu'
      })
    }
    throw error
  }
})
