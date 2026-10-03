import { and, desc, eq, inArray } from 'drizzle-orm'
import { useDb, matches, archetypes, matchups, games, metas } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export interface ArchetypeMetaStats {
  id: string
  name: string
  card1Name: string | null
  card1ImageUrl: string | null
  card2Name: string | null
  card2ImageUrl: string | null
  isArchived: boolean
  played: {
    total: number
    wins: number
    losses: number
    draws: number
    winrate: number
  }
  faced: {
    total: number
    wins: number
    losses: number
    draws: number
    winrate: number
    showRate: number
  }
  totalInvolvements: number
}

export interface MetaOverviewStats {
  totalMatches: number
  totalWins: number
  totalLosses: number
  totalDraws: number
  overallWinrate: number
  archetypesCount: number
  mostPlayedArchetype: { id: string; name: string; total: number; winrate: number } | null
  mostFacedArchetype: { id: string; name: string; total: number; winrate: number; showRate: number } | null
}

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const query = getQuery(event)

  const gameId = query.gameId ? String(query.gameId) : null
  const metaId = query.metaId ? String(query.metaId) : null

  if (!gameId || !metaId) {
    return {
      game: null,
      meta: null,
      overview: {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        overallWinrate: 0,
        archetypesCount: 0,
        mostPlayedArchetype: null,
        mostFacedArchetype: null
      },
      archetypes: []
    }
  }

  const db = useDb()

  // 1. Informations de jeu et de méta
  const [selectedGame] = await db
    .select()
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)

  const [selectedMeta] = await db
    .select()
    .from(metas)
    .where(and(eq(metas.id, metaId), eq(metas.userId, user.id)))
    .limit(1)

  // 2. Tous les archétypes de la méta pour cet utilisateur (non archivés)
  const metaArchetypes = await db
    .select()
    .from(archetypes)
    .where(
      and(
        eq(archetypes.userId, user.id),
        eq(archetypes.gameId, gameId),
        eq(archetypes.metaId, metaId)
      )
    )
    .orderBy(archetypes.name)

  if (metaArchetypes.length === 0) {
    return {
      game: selectedGame || null,
      meta: selectedMeta || null,
      overview: {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        overallWinrate: 0,
        archetypesCount: 0,
        mostPlayedArchetype: null,
        mostFacedArchetype: null
      },
      archetypes: []
    }
  }

  // 3. Tous les matchups et matchs de cette méta
  const metaMatches = await db
    .select({
      id: matches.id,
      result: matches.result,
      format: matches.format,
      myArchetypeId: matchups.myArchetypeId,
      opponentArchetypeId: matchups.opponentArchetypeId,
      createdAt: matches.createdAt
    })
    .from(matches)
    .innerJoin(matchups, eq(matches.matchupId, matchups.id))
    .where(
      and(
        eq(matches.userId, user.id),
        eq(matchups.metaId, metaId)
      )
    )

  const totalMetaMatches = metaMatches.length
  let totalMetaWins = 0
  let totalMetaLosses = 0
  let totalMetaDraws = 0

  // Structures d'agrégation par archétype
  interface StatAcc {
    playedWins: number
    playedLosses: number
    playedDraws: number
    facedWins: number // matches user won against this archetype
    facedLosses: number // matches user lost against this archetype
    facedDraws: number // matches user drew against this archetype
  }

  const accMap = new Map<string, StatAcc>()

  for (const arch of metaArchetypes) {
    accMap.set(arch.id, {
      playedWins: 0,
      playedLosses: 0,
      playedDraws: 0,
      facedWins: 0,
      facedLosses: 0,
      facedDraws: 0
    })
  }

  for (const m of metaMatches) {
    if (m.result === 'win') totalMetaWins++
    else if (m.result === 'loss') totalMetaLosses++
    else if (m.result === 'draw') totalMetaDraws++

    // Deck joué par l'utilisateur
    const playedAcc = accMap.get(m.myArchetypeId)
    if (playedAcc) {
      if (m.result === 'win') playedAcc.playedWins++
      else if (m.result === 'loss') playedAcc.playedLosses++
      else if (m.result === 'draw') playedAcc.playedDraws++
    }

    // Deck affronté par l'utilisateur
    const facedAcc = accMap.get(m.opponentArchetypeId)
    if (facedAcc) {
      if (m.result === 'win') facedAcc.facedWins++
      else if (m.result === 'loss') facedAcc.facedLosses++
      else if (m.result === 'draw') facedAcc.facedDraws++
    }
  }

  // Construction de la liste détaillée
  const statsList: ArchetypeMetaStats[] = metaArchetypes.map((arch) => {
    const acc = accMap.get(arch.id) || {
      playedWins: 0,
      playedLosses: 0,
      playedDraws: 0,
      facedWins: 0,
      facedLosses: 0,
      facedDraws: 0
    }

    const playedTotal = acc.playedWins + acc.playedLosses + acc.playedDraws
    const playedWinrate = playedTotal > 0 ? Math.round((acc.playedWins / playedTotal) * 100) : 0

    const facedTotal = acc.facedWins + acc.facedLosses + acc.facedDraws
    const facedWinrate = facedTotal > 0 ? Math.round((acc.facedWins / facedTotal) * 100) : 0
    const showRate = totalMetaMatches > 0 ? Math.round((facedTotal / totalMetaMatches) * 100) : 0

    return {
      id: arch.id,
      name: arch.name,
      card1Name: arch.card1Name,
      card1ImageUrl: arch.card1ImageUrl,
      card2Name: arch.card2Name,
      card2ImageUrl: arch.card2ImageUrl,
      isArchived: arch.isArchived,
      played: {
        total: playedTotal,
        wins: acc.playedWins,
        losses: acc.playedLosses,
        draws: acc.playedDraws,
        winrate: playedWinrate
      },
      faced: {
        total: facedTotal,
        wins: acc.facedWins,
        losses: acc.facedLosses,
        draws: acc.facedDraws,
        winrate: facedWinrate,
        showRate
      },
      totalInvolvements: playedTotal + facedTotal
    }
  })

  // Identifier le plus joué et le plus affronté
  let mostPlayed: { id: string; name: string; total: number; winrate: number } | null = null
  let mostFaced: { id: string; name: string; total: number; winrate: number; showRate: number } | null = null

  for (const item of statsList) {
    if (item.played.total > 0 && (!mostPlayed || item.played.total > mostPlayed.total)) {
      mostPlayed = {
        id: item.id,
        name: item.name,
        total: item.played.total,
        winrate: item.played.winrate
      }
    }
    if (item.faced.total > 0 && (!mostFaced || item.faced.total > mostFaced.total)) {
      mostFaced = {
        id: item.id,
        name: item.name,
        total: item.faced.total,
        winrate: item.faced.winrate,
        showRate: item.faced.showRate
      }
    }
  }

  const overallWinrate = totalMetaMatches > 0 ? Math.round((totalMetaWins / totalMetaMatches) * 100) : 0

  return {
    game: selectedGame || null,
    meta: selectedMeta || null,
    overview: {
      totalMatches: totalMetaMatches,
      totalWins: totalMetaWins,
      totalLosses: totalMetaLosses,
      totalDraws: totalMetaDraws,
      overallWinrate,
      archetypesCount: metaArchetypes.length,
      mostPlayedArchetype: mostPlayed,
      mostFacedArchetype: mostFaced
    },
    archetypes: statsList
  }
})
