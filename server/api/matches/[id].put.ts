import { and, eq } from 'drizzle-orm'
import { useDb, matches } from '../../../database'
import { requireAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const idParam = getRouterParam(event, 'id')
  const matchId = parseInt(idParam || '', 10)

  if (isNaN(matchId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de match invalide'
    })
  }

  const body = await readBody(event)
  const db = useDb()

  const updateData: Record<string, any> = {}

  if (body.result !== undefined) {
    if (body.result !== 'win' && body.result !== 'loss') {
      throw createError({ statusCode: 400, statusMessage: "Le résultat doit être 'win' ou 'loss'" })
    }
    updateData.result = body.result
  }

  if (body.notes !== undefined) {
    updateData.notes = body.notes ? String(body.notes).trim() : null
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
