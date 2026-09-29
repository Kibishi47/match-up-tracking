import { and, eq } from 'drizzle-orm'
import { useDb, matches, archetypes } from '../../../database'
import { requireAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const gameId = parseInt(body?.gameId, 10)
  const userArchetypeId = parseInt(body?.userArchetypeId, 10)
  const opponentArchetypeId = parseInt(body?.opponentArchetypeId, 10)
  const result = body?.result

  if (isNaN(gameId) || isNaN(userArchetypeId) || isNaN(opponentArchetypeId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'gameId, userArchetypeId et opponentArchetypeId sont requis'
    })
  }

  if (result !== 'win' && result !== 'loss') {
    throw createError({
      statusCode: 400,
      statusMessage: "Le résultat doit être 'win' ou 'loss'"
    })
  }

  const db = useDb()

  // S'assurer que les archétypes appartiennent bien à l'utilisateur
  const userDecks = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.id, userArchetypeId), eq(archetypes.userId, user.id)))
    .limit(1)

  const opponentDecks = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.id, opponentArchetypeId), eq(archetypes.userId, user.id)))
    .limit(1)

  if (userDecks.length === 0 || opponentDecks.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Archétype non trouvé ou non autorisé'
    })
  }

  const [newMatch] = await db
    .insert(matches)
    .values({
      userId: user.id,
      gameId,
      userArchetypeId,
      opponentArchetypeId,
      result,
      notes: body.notes ? String(body.notes).trim() : null,
      playedAt: body.playedAt ? new Date(body.playedAt) : new Date()
    })
    .returning()

  return {
    ...newMatch,
    userArchetype: userDecks[0],
    opponentArchetype: opponentDecks[0]
  }
})
