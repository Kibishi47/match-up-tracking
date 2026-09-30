import { and, eq } from 'drizzle-orm'
import { useDb, matches } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const matchId = getRouterParam(event, 'id')

  if (!matchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de match requis'
    })
  }

  const body = await readBody(event)
  const db = useDb()

  const updateData: Record<string, any> = {}

  if (body.result !== undefined) {
    if (body.result !== 'win' && body.result !== 'loss' && body.result !== 'draw') {
      throw createError({ statusCode: 400, statusMessage: "Le résultat doit être 'win', 'loss' ou 'draw'" })
    }
    updateData.result = body.result
  }
  if (body.notes !== undefined) {
    updateData.notes = String(body.notes || '').trim()
  }
  if (body.playedAt !== undefined) {
    updateData.playedAt = new Date(body.playedAt)
  }

  const [updatedMatch] = await db
    .update(matches)
    .set(updateData)
    .where(and(eq(matches.id, matchId), eq(matches.userId, user.id)))
    .returning()

  if (!updatedMatch) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Match introuvable ou non autorisé'
    })
  }

  return updatedMatch
})
