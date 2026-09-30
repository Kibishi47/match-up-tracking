import { and, eq } from 'drizzle-orm'
import { useDb, matches, matchups, archetypes, metas } from '../../db'
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

  const myDeck = myDecks[0]
  const oppDeck = opponentDecks[0]

  let metaId = myDeck.metaId || oppDeck.metaId
  if (!metaId) {
    const defaultMeta = await db
      .select()
      .from(metas)
      .where(and(eq(metas.userId, user.id), eq(metas.gameId, gameId)))
      .limit(1)
      .then(rows => rows[0])
    if (defaultMeta) metaId = defaultMeta.id
  }

  if (!metaId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format / Méta introuvable pour ce match'
    })
  }

  // Find-or-create du matchup
  let [targetMatchup] = await db
    .select()
    .from(matchups)
    .where(
      and(
        eq(matchups.userId, user.id),
        eq(matchups.myArchetypeId, myArchetypeId),
        eq(matchups.opponentArchetypeId, opponentArchetypeId)
      )
    )
    .limit(1)

  if (!targetMatchup) {
    const [created] = await db
      .insert(matchups)
      .values({
        userId: user.id,
        gameId,
        metaId,
        myArchetypeId,
        opponentArchetypeId,
        notes: ''
      })
      .returning()
    targetMatchup = created
  }

  const [newMatch] = await db
    .insert(matches)
    .values({
      userId: user.id,
      matchupId: targetMatchup.id,
      result,
      playedAt: body.playedAt ? new Date(body.playedAt) : new Date()
    })
    .returning()

  return {
    ...newMatch,
    matchup: targetMatchup,
    myArchetype: myDeck,
    opponentArchetype: oppDeck
  }
})
