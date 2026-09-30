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

  const db = useDb()

  const [deleted] = await db
    .delete(metas)
    .where(and(eq(metas.id, metaId), eq(metas.userId, user.id)))
    .returning()

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Méta introuvable ou non autorisée'
    })
  }

  return { success: true, deleted }
})
