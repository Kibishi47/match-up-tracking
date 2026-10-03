import { and, desc, eq, inArray } from 'drizzle-orm'
import { useDb, matches, matchups } from '../../db'
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

  const matchupConditions = [
    eq(matchups.userId, user.id),
    eq(matchups.gameId, gameId)
  ]

  if (myArchetypeId) {
    matchupConditions.push(eq(matchups.myArchetypeId, myArchetypeId))
  }

  const userMatchups = await db.query.matchups.findMany({
    where: and(...matchupConditions)
  })

  const matchupIds = userMatchups.map((m) => m.id)

  if (matchupIds.length === 0) {
    return {
      recentMatches: [],
      stats: {
        total: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winrate: 0
      },
      statsByOpponent: {}
    }
  }

  // Récent historique des matchs
  const rawRecentMatches = await db.query.matches.findMany({
    where: and(
      eq(matches.userId, user.id),
      inArray(matches.matchupId, matchupIds)
    ),
    orderBy: [desc(matches.createdAt)],
    limit: 50,
    with: {
      matchup: {
        with: {
          myArchetype: true,
          opponentArchetype: true
        }
      }
    }
  })

  const recentMatches = rawRecentMatches.map((m) => ({
    id: m.id,
    userId: m.userId,
    matchupId: m.matchupId,
    format: m.format,
    result: m.result,
    game1: m.game1,
    game2: m.game2,
    game3: m.game3,
    notes: m.notes || '',
    playedAt: m.playedAt,
    createdAt: m.createdAt,
    myArchetypeId: m.matchup.myArchetypeId,
    opponentArchetypeId: m.matchup.opponentArchetypeId,
    myArchetype: m.matchup.myArchetype,
    opponentArchetype: m.matchup.opponentArchetype
  }))

  // Calcul des stats
  let totalWins = 0
  let totalLosses = 0
  let totalDraws = 0

  const statsByOpponent: Record<string, { wins: number; losses: number; draws: number; total: number; winrate: number }> = {}

  const allFilteredMatches = await db
    .select({
      matchupId: matches.matchupId,
      result: matches.result
    })
    .from(matches)
    .where(and(eq(matches.userId, user.id), inArray(matches.matchupId, matchupIds)))

  const matchupMap = new Map(userMatchups.map((m) => [m.id, m]))

  for (const m of allFilteredMatches) {
    if (m.result === 'win') totalWins++
    else if (m.result === 'loss') totalLosses++
    else if (m.result === 'draw') totalDraws++

    const mu = matchupMap.get(m.matchupId)
    if (!mu) continue
    const oppId = mu.opponentArchetypeId

    if (!statsByOpponent[oppId]) {
      statsByOpponent[oppId] = { wins: 0, losses: 0, draws: 0, total: 0, winrate: 0 }
    }
    const stat = statsByOpponent[oppId]
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
