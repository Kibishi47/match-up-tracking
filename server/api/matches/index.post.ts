import { and, eq } from 'drizzle-orm'
import { useDb, matches, matchups, archetypes, metas } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const gameId = body?.gameId ? String(body.gameId) : null
  const myArchetypeId = body?.myArchetypeId ? String(body.myArchetypeId) : (body?.userArchetypeId ? String(body.userArchetypeId) : null)
  const opponentArchetypeId = body?.opponentArchetypeId ? String(body.opponentArchetypeId) : null
  let format = body?.format === 'bo3' ? 'bo3' : 'bo1'
  let game1 = body?.game1 || null
  let game2 = body?.game2 || null
  let game3 = body?.game3 || null
  let result = body?.result

  if (format === 'bo1') {
    if (!result || (result !== 'win' && result !== 'loss' && result !== 'draw')) {
      throw createError({
        statusCode: 400,
        statusMessage: "Le résultat doit être 'win', 'loss' ou 'draw'"
      })
    }
    game1 = result
    game2 = null
    game3 = null
  } else {
    // format === 'bo3'
    if (!game1 || (game1 !== 'win' && game1 !== 'loss' && game1 !== 'draw')) {
      throw createError({
        statusCode: 400,
        statusMessage: "La manche 1 (game1) est requise pour un match en BO3 ('win', 'loss' ou 'draw')"
      })
    }
    if (!game2 && game1 !== 'draw') {
      throw createError({
        statusCode: 400,
        statusMessage: "La manche 2 (game2) est requise pour un match en BO3 ('win', 'loss' ou 'draw')"
      })
    }
    if (game2 && game2 !== 'win' && game2 !== 'loss' && game2 !== 'draw') {
      throw createError({
        statusCode: 400,
        statusMessage: "La manche 2 (game2) doit être 'win', 'loss', 'draw' ou null"
      })
    }
    if (game3 && game3 !== 'win' && game3 !== 'loss' && game3 !== 'draw') {
      throw createError({
        statusCode: 400,
        statusMessage: "La manche 3 (game3) doit être 'win', 'loss', 'draw' ou null"
      })
    }

    // Calcul et validation du résultat global d'après les manches
    const gamesList = [game1, game2, game3].filter(Boolean)
    const winsCount = gamesList.filter(g => g === 'win').length
    const lossesCount = gamesList.filter(g => g === 'loss').length

    let computedResult: 'win' | 'loss' | 'draw'
    if (winsCount >= 2) {
      computedResult = 'win'
    } else if (lossesCount >= 2) {
      computedResult = 'loss'
    } else if (winsCount === lossesCount) {
      computedResult = 'draw'
    } else {
      computedResult = result || (winsCount > lossesCount ? 'win' : (lossesCount > winsCount ? 'loss' : 'draw'))
    }

    if (result && result !== computedResult) {
      throw createError({
        statusCode: 400,
        statusMessage: `Incohérence entre les manches et le résultat global (attendu: ${computedResult}, reçu: ${result})`
      })
    }
    result = computedResult

    // Si 2-0 ou 0-2, s'assurer que game3 est bien null
    if ((game1 === 'win' && game2 === 'win') || (game1 === 'loss' && game2 === 'loss')) {
      game3 = null
    }
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
      format,
      result,
      game1,
      game2,
      game3,
      notes: body.notes ? String(body.notes).trim() : '',
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
