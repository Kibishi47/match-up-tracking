import { and, eq } from 'drizzle-orm'
import { useDb, matches, archetypes } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const gameId = body?.gameId ? String(body.gameId) : null
  const myArchetypeId = body?.myArchetypeId ? String(body.myArchetypeId) : (body?.userArchetypeId ? String(body.userArchetypeId) : null)
  const opponentArchetypeId = body?.opponentArchetypeId ? String(body.opponentArchetypeId) : null
  const result = body?.result

  if (!gameId || !myArchetypeId || !opponentArchetypeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'gameId, myArchetypeId et opponentArchetypeId sont requis'
    })
  }

  if (result !== 'win' && result !== 'loss' && result !== 'draw') {
    throw createError({
      statusCode: 400,
      statusMessage: "Le résultat doit être 'win', 'loss' ou 'draw'"
    })
  }

  const db = useDb()

  // S'assurer que les archétypes appartiennent bien à l'utilisateur
  const myDecks = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.id, myArchetypeId), eq(archetypes.userId, user.id)))
    .limit(1)

  const opponentDecks = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.id, opponentArchetypeId), eq(archetypes.userId, user.id)))
    .limit(1)

  if (myDecks.length === 0 || opponentDecks.length === 0) {
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
      myArchetypeId,
      opponentArchetypeId,
      result,
      notes: body.notes ? String(body.notes).trim() : null,
      playedAt: body.playedAt ? new Date(body.playedAt) : new Date()
    })
    .returning()

  return {
    ...newMatch,
    myArchetype: myDecks[0],
    opponentArchetype: opponentDecks[0]
  }
})
