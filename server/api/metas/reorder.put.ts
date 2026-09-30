import { and, eq } from 'drizzle-orm'
import { useDb, metas } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const metaIds = body?.metaIds
  const gameId = body?.gameId ? String(body.gameId) : null

  if (!Array.isArray(metaIds) || metaIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Liste des identifiants de métas requise'
    })
  }

  const db = useDb()

  for (let i = 0; i < metaIds.length; i++) {
    const metaId = String(metaIds[i])
    await db
      .update(metas)
      .set({ position: i })
      .where(
        and(
          eq(metas.id, metaId),
          eq(metas.userId, user.id),
          gameId ? eq(metas.gameId, gameId) : undefined
        )
      )
  }

  return { success: true }
})
