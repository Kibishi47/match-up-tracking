import { and, desc, eq, sql } from 'drizzle-orm'
import { useDb, matches, archetypes } from '../db'
import { requireAuthUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const query = getQuery(event)

  const gameId = query.gameId ? String(query.gameId) : null
  const myArchetypeId = query.myArchetypeId ? String(query.myArchetypeId) : null

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'gameId est requis'
    })
  }

  const db = useDb()

  // 1. Tous les archétypes non archivés de l'utilisateur pour ce jeu
  const userArchetypes = await db
    .select()
    .from(archetypes)
    .where(
      and(
        eq(archetypes.userId, user.id),
        eq(archetypes.gameId, gameId),
        eq(archetypes.isArchived, false)
      )
    )
    .orderBy(archetypes.name)

  // Si aucun deck actif n'est sélectionné, renvoyer les archétypes et des stats vides
  if (!myArchetypeId) {
    return {
      archetypes: userArchetypes,
      activeDeck: null,
      stats: {
        total: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winrate: 0
      },
      statsByOpponent: {},
      recentMatches: []
    }
  }

  const activeDeck = userArchetypes.find(d => d.id === myArchetypeId) || null

  // 2. Conditions pour les matchs joués avec ce deck actif
  const matchConditions = [
    eq(matches.userId, user.id),
    eq(matches.gameId, gameId),
    eq(matches.myArchetypeId, myArchetypeId)
  ]

  // 3. Récupération des matchs pour calcul agrégé (Win Rate & Show Rate)
  const deckMatches = await db
    .select({
      opponentArchetypeId: matches.opponentArchetypeId,
      result: matches.result
    })
    .from(matches)
    .where(and(...matchConditions))

  const totalDeckMatches = deckMatches.length
  let totalWins = 0
  let totalLosses = 0
  let totalDraws = 0

  // Décompte par adversaire
  const statsByOpponentMap: Record<string, { wins: number; losses: number; draws: number; total: number; winrate: number; showRate: number }> = {}

  for (const m of deckMatches) {
    if (m.result === 'win') totalWins++
    else if (m.result === 'loss') totalLosses++
    else if (m.result === 'draw') totalDraws++

    if (!statsByOpponentMap[m.opponentArchetypeId]) {
      statsByOpponentMap[m.opponentArchetypeId] = {
        wins: 0,
        losses: 0,
        draws: 0,
        total: 0,
        winrate: 0,
        showRate: 0
      }
    }

    const stat = statsByOpponentMap[m.opponentArchetypeId]
    if (m.result === 'win') stat.wins++
    else if (m.result === 'loss') stat.losses++
    else if (m.result === 'draw') stat.draws++
    stat.total++
  }

  // Calcul du Win Rate et Show Rate pour chaque archétype rencontré
  for (const oppId in statsByOpponentMap) {
    const stat = statsByOpponentMap[oppId]
    // Win Rate (WR) = (Victoires / Total matchs contre cet adversaire) * 100
    stat.winrate = stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0
    // Show Rate (SR) = (Matchs contre cet adversaire / Total matchs joués avec le deck actif) * 100
    stat.showRate = totalDeckMatches > 0 ? Math.round((stat.total / totalDeckMatches) * 100) : 0
  }

  // S'assurer que tous les archétypes adverses existants ont une entrée (même à 0 match)
  for (const arch of userArchetypes) {
    if (!statsByOpponentMap[arch.id]) {
      statsByOpponentMap[arch.id] = {
        wins: 0,
        losses: 0,
        draws: 0,
        total: 0,
        winrate: 0,
        showRate: 0
      }
    }
  }

  const overallWinrate = totalDeckMatches > 0 ? Math.round((totalWins / totalDeckMatches) * 100) : 0

  // 4. Historique récent des 50 derniers matchs
  const recentMatches = await db.query.matches.findMany({
    where: and(...matchConditions),
    orderBy: [desc(matches.createdAt)],
    limit: 50,
    with: {
      myArchetype: true,
      opponentArchetype: true
    }
  })

  return {
    archetypes: userArchetypes,
    activeDeck,
    stats: {
      total: totalDeckMatches,
      wins: totalWins,
      losses: totalLosses,
      draws: totalDraws,
      winrate: overallWinrate
    },
    statsByOpponent: statsByOpponentMap,
    recentMatches
  }
})
