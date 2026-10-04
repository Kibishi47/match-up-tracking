import { and, eq } from 'drizzle-orm'
import { useDb, matches, archetypes, matchups, games, metas } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export interface ArchetypeFormatStats {
  id: string
  name: string
  card1Name: string | null
  card1ImageUrl: string | null
  card2Name: string | null
  card2ImageUrl: string | null
  isArchived: boolean

  // Volume réel dédoublonné
  distinctMatches: number
  presenceRate: number // 0-100%

  // Bloc 1: Performance globale de l'archétype (hors miroir)
  overall: {
    wins: number
    losses: number
    draws: number
    mirrorMatches: number
    winrate: number // 0-100%
  }

  // Bloc 2: Piloté par le joueur
  played: {
    total: number
    wins: number
    losses: number
    draws: number
    winrate: number | null // null si 0 match
  }

  // Bloc 3: Affronté chez l'adversaire
  faced: {
    total: number
    wins: number
    losses: number
    draws: number
    showRate: number // 0-100%
    winrate: number | null // null si 0 confrontation
  }
}

export interface FormatStatsResponse {
  game: any
  meta: any
  totalMatches: number
  totalWins: number
  totalLosses: number
  totalDraws: number
  overallWinrate: number
  archetypesCount: number
  mostPlayedDeck: { id: string; name: string; total: number; winrate: number } | null
  mostFacedDeck: { id: string; name: string; total: number; showRate: number } | null
  overview?: {
    totalMatches: number
    totalWins: number
    totalLosses: number
    totalDraws: number
    overallWinrate: number
    archetypesCount: number
    mostPlayedArchetype: { id: string; name: string; total: number; winrate: number } | null
    mostFacedArchetype: { id: string; name: string; total: number; winrate: number; showRate: number } | null
  }
  archetypes: ArchetypeFormatStats[]
}

export type ArchetypeMetaStats = ArchetypeFormatStats
export type MetaOverviewStats = NonNullable<FormatStatsResponse['overview']>

export default defineEventHandler(async (event): Promise<FormatStatsResponse> => {
  const user = await requireAuthUser(event)
  const query = getQuery(event)

  const gameId = query.gameId ? String(query.gameId) : null
  const metaId = query.metaId ? String(query.metaId) : null

  const emptyResponse: FormatStatsResponse = {
    game: null,
    meta: null,
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    overallWinrate: 0,
    archetypesCount: 0,
    mostPlayedDeck: null,
    mostFacedDeck: null,
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

  if (!gameId || !metaId) {
    return emptyResponse
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
    .where(
      and(
        eq(metas.id, metaId),
        eq(metas.userId, user.id),
        eq(metas.gameId, gameId)
      )
    )
    .limit(1)

  // 2. Tous les archétypes non archivés de la méta pour cet utilisateur
  const metaArchetypes = await db
    .select()
    .from(archetypes)
    .where(
      and(
        eq(archetypes.userId, user.id),
        eq(archetypes.gameId, gameId),
        eq(archetypes.metaId, metaId),
        eq(archetypes.isArchived, false)
      )
    )
    .orderBy(archetypes.name)

  if (metaArchetypes.length === 0) {
    return {
      ...emptyResponse,
      game: selectedGame || null,
      meta: selectedMeta || null
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
        eq(matchups.gameId, gameId),
        eq(matchups.metaId, metaId)
      )
    )

  const totalMetaMatches = metaMatches.length
  let totalMetaWins = 0
  let totalMetaLosses = 0
  let totalMetaDraws = 0

  // 4. Structures d'agrégation brute par archétype
  interface StatAcc {
    playedWins: number
    playedLosses: number
    playedDraws: number
    facedWins: number // victoires du joueur face à cet archétype
    facedLosses: number // défaites du joueur face à cet archétype (l'archétype a gagné)
    facedDraws: number
    overallWins: number // victoires de l'archétype hors miroir
    overallLosses: number // défaites de l'archétype hors miroir
    overallDraws: number // nuls de l'archétype hors miroir
    mirrorMatches: number // matchs miroirs (exclus du winrate global)
    distinctMatchIds: Set<string>
  }

  const accMap = new Map<string, StatAcc>()

  for (const arch of metaArchetypes) {
    accMap.set(arch.id, {
      playedWins: 0,
      playedLosses: 0,
      playedDraws: 0,
      facedWins: 0,
      facedLosses: 0,
      facedDraws: 0,
      overallWins: 0,
      overallLosses: 0,
      overallDraws: 0,
      mirrorMatches: 0,
      distinctMatchIds: new Set<string>()
    })
  }

  for (const m of metaMatches) {
    if (m.result === 'win') totalMetaWins++
    else if (m.result === 'loss') totalMetaLosses++
    else if (m.result === 'draw') totalMetaDraws++

    const isMirror = m.myArchetypeId === m.opponentArchetypeId

    // Enregistrement deck joué
    const playedAcc = accMap.get(m.myArchetypeId)
    if (playedAcc) {
      if (m.result === 'win') playedAcc.playedWins++
      else if (m.result === 'loss') playedAcc.playedLosses++
      else if (m.result === 'draw') playedAcc.playedDraws++
      playedAcc.distinctMatchIds.add(m.id)

      if (isMirror) {
        playedAcc.mirrorMatches++
      } else {
        // Deck joué hors miroir : POV deck = résultat du joueur
        if (m.result === 'win') playedAcc.overallWins++
        else if (m.result === 'loss') playedAcc.overallLosses++
        else if (m.result === 'draw') playedAcc.overallDraws++
      }
    }

    // Enregistrement deck adverse affronté
    const facedAcc = accMap.get(m.opponentArchetypeId)
    if (facedAcc) {
      if (m.result === 'win') facedAcc.facedWins++
      else if (m.result === 'loss') facedAcc.facedLosses++
      else if (m.result === 'draw') facedAcc.facedDraws++
      facedAcc.distinctMatchIds.add(m.id)

      if (!isMirror) {
        // Deck adverse hors miroir : POV deck = inverse du résultat joueur
        if (m.result === 'win') facedAcc.overallLosses++
        else if (m.result === 'loss') facedAcc.overallWins++
        else if (m.result === 'draw') facedAcc.overallDraws++
      }
    }
  }

  // 5. Calcul des métriques statistiques conformes à la Théorie des Jeux TCG
  const statsList: ArchetypeFormatStats[] = metaArchetypes.map((arch) => {
    const acc = accMap.get(arch.id) || {
      playedWins: 0,
      playedLosses: 0,
      playedDraws: 0,
      facedWins: 0,
      facedLosses: 0,
      facedDraws: 0,
      overallWins: 0,
      overallLosses: 0,
      overallDraws: 0,
      mirrorMatches: 0,
      distinctMatchIds: new Set<string>()
    }

    // A. Bilan Joueur (DECK JOUÉ)
    const playedTotal = acc.playedWins + acc.playedLosses + acc.playedDraws
    const playedWinrate = playedTotal > 0
      ? Math.round((acc.playedWins / playedTotal) * 100)
      : null

    // B. Bilan Adversaire (ADVERSAIRE)
    const facedTotal = acc.facedWins + acc.facedLosses + acc.facedDraws
    const facedWinrate = facedTotal > 0
      ? Math.round((acc.facedWins / facedTotal) * 100)
      : null
    const showRate = totalMetaMatches > 0
      ? Math.round((facedTotal / totalMetaMatches) * 100)
      : 0

    // C. Bilan et Win Rate GLOBAL de l'archétype (Performance intrinsèque hors miroir)
    const nonMirrorTotal = acc.overallWins + acc.overallLosses + acc.overallDraws
    const overallWinrate = nonMirrorTotal > 0
      ? Math.round((acc.overallWins / nonMirrorTotal) * 100)
      : 0

    // D. Présence Méta & Volume dédoublonné
    const distinctMatches = acc.distinctMatchIds.size
    const presenceRate = totalMetaMatches > 0
      ? Math.round((distinctMatches / totalMetaMatches) * 100)
      : 0

    return {
      id: arch.id,
      name: arch.name,
      card1Name: arch.card1Name,
      card1ImageUrl: arch.card1ImageUrl,
      card2Name: arch.card2Name,
      card2ImageUrl: arch.card2ImageUrl,
      isArchived: arch.isArchived,

      distinctMatches,
      presenceRate,

      overall: {
        wins: acc.overallWins,
        losses: acc.overallLosses,
        draws: acc.overallDraws,
        mirrorMatches: acc.mirrorMatches,
        winrate: overallWinrate
      },

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
        showRate,
        winrate: facedWinrate
      }
    }
  })

  // 6. Identifier le deck le plus joué et le plus affronté
  let mostPlayed: { id: string; name: string; total: number; winrate: number } | null = null
  let mostFaced: { id: string; name: string; total: number; showRate: number; winrate?: number } | null = null

  for (const item of statsList) {
    if (item.played.total > 0 && (!mostPlayed || item.played.total > mostPlayed.total)) {
      mostPlayed = {
        id: item.id,
        name: item.name,
        total: item.played.total,
        winrate: item.played.winrate ?? 0
      }
    }
    if (item.faced.total > 0 && (!mostFaced || item.faced.total > mostFaced.total)) {
      mostFaced = {
        id: item.id,
        name: item.name,
        total: item.faced.total,
        showRate: item.faced.showRate,
        winrate: item.faced.winrate ?? 0
      }
    }
  }

  const overallMetaWinrate = totalMetaMatches > 0
    ? Math.round((totalMetaWins / totalMetaMatches) * 100)
    : 0

  return {
    game: selectedGame || null,
    meta: selectedMeta || null,
    totalMatches: totalMetaMatches,
    totalWins: totalMetaWins,
    totalLosses: totalMetaLosses,
    totalDraws: totalMetaDraws,
    overallWinrate: overallMetaWinrate,
    archetypesCount: metaArchetypes.length,
    mostPlayedDeck: mostPlayed,
    mostFacedDeck: mostFaced ? { id: mostFaced.id, name: mostFaced.name, total: mostFaced.total, showRate: mostFaced.showRate } : null,
    overview: {
      totalMatches: totalMetaMatches,
      totalWins: totalMetaWins,
      totalLosses: totalMetaLosses,
      totalDraws: totalMetaDraws,
      overallWinrate: overallMetaWinrate,
      archetypesCount: metaArchetypes.length,
      mostPlayedArchetype: mostPlayed,
      mostFacedArchetype: mostFaced ? { id: mostFaced.id, name: mostFaced.name, total: mostFaced.total, winrate: mostFaced.winrate ?? 0, showRate: mostFaced.showRate } : null
    },
    archetypes: statsList
  }
})
