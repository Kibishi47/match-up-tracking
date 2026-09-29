import { and, desc, eq } from 'drizzle-orm'
import { useDb, matches } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const query = getQuery(event)
  const gameId = query.gameId ? String(query.gameId) : undefined
  const myArchetypeId = query.myArchetypeId ? String(query.myArchetypeId) : undefined

  if (!gameId) {
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

  if (myArchetypeId) {
    conditions.push(eq(matches.myArchetypeId, myArchetypeId))
  }

  // Récent historique des matchs
  const recentMatches = await db.query.matches.findMany({
    where: and(...conditions),
    orderBy: [desc(matches.createdAt)],
    limit: 50,
    with: {
      myArchetype: true,
      opponentArchetype: true
    }
  })

  // Calcul des stats
  let totalWins = 0
  let totalLosses = 0
  let totalDraws = 0

  const statsByOpponent: Record<string, { wins: number; losses: number; draws: number; total: number; winrate: number }> = {}

  const allFilteredMatches = await db
    .select({
      opponentArchetypeId: matches.opponentArchetypeId,
      result: matches.result
    })
    .from(matches)
    .where(and(...conditions))

  for (const m of allFilteredMatches) {
    if (m.result === 'win') totalWins++
    else if (m.result === 'loss') totalLosses++
    else if (m.result === 'draw') totalDraws++

    if (!statsByOpponent[m.opponentArchetypeId]) {
      statsByOpponent[m.opponentArchetypeId] = { wins: 0, losses: 0, draws: 0, total: 0, winrate: 0 }
    }
    const stat = statsByOpponent[m.opponentArchetypeId]
    if (m.result === 'win') stat.wins++
    else if (m.result === 'loss') stat.losses++
    else if (m.result === 'draw') stat.draws++
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
      draws: totalDraws,
      winrate: overallWinrate
    },
    statsByOpponent
  }
})
