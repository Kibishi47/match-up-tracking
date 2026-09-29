import { and, desc, eq, sql } from 'drizzle-orm'
import { useDb, matches, archetypes } from '../../database'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const query = getQuery(event)
  const gameId = query.gameId ? parseInt(query.gameId as string, 10) : undefined
  const userArchetypeId = query.userArchetypeId ? parseInt(query.userArchetypeId as string, 10) : undefined

  if (!gameId || isNaN(gameId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'gameId est requis'
    })
  }

  const db = useDb()

  const conditions = [
    eq(matches.userId, user.id),
    eq(matches.gameId, gameId)
  ]

  if (userArchetypeId && !isNaN(userArchetypeId)) {
    conditions.push(eq(matches.userArchetypeId, userArchetypeId))
  }

  // 1. Récent historique des matchs avec noms des archétypes
  const recentMatches = await db.query.matches.findMany({
    where: and(...conditions),
    orderBy: [desc(matches.createdAt)],
    limit: 50,
    with: {
      userArchetype: true,
      opponentArchetype: true
    }
  })

  // 2. Stats globales pour les filtres actifs
  const totalMatches = recentMatches.length
  let totalWins = 0
  let totalLosses = 0

  // 3. Stats par archétype adverse
  const statsByOpponent: Record<number, { wins: number; losses: number; total: number; winrate: number }> = {}

  // Pour avoir les stats exhaustives (pas seulement limitées à 50)
  const allFilteredMatches = await db
    .select({
      opponentArchetypeId: matches.opponentArchetypeId,
      result: matches.result
    })
    .from(matches)
    .where(and(...conditions))

  for (const m of allFilteredMatches) {
    if (m.result === 'win') totalWins++
    if (m.result === 'loss') totalLosses++

    if (!statsByOpponent[m.opponentArchetypeId]) {
      statsByOpponent[m.opponentArchetypeId] = { wins: 0, losses: 0, total: 0, winrate: 0 }
    }
    const stat = statsByOpponent[m.opponentArchetypeId]
    if (m.result === 'win') stat.wins++
    if (m.result === 'loss') stat.losses++
    stat.total++
    stat.winrate = stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0
  }

  const overallTotal = allFilteredMatches.length
  const overallWinrate = overallTotal > 0 ? Math.round((totalWins / overallTotal) * 100) : 0

  return {
    recentMatches,
    stats: {
      total: overallTotal,
      wins: totalWins,
      losses: totalLosses,
      winrate: overallWinrate
    },
    statsByOpponent
  }
})
