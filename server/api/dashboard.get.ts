import { and, desc, eq, sql } from 'drizzle-orm'
import { useDb, matches, archetypes } from '../db'
import { requireAuthUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const query = getQuery(event)

  const gameId = query.gameId ? String(query.gameId) : null
  const metaId = query.metaId ? String(query.metaId) : null
  const myArchetypeId = query.myArchetypeId 
    ? String(query.myArchetypeId) 
    : (query.myDeckId ? String(query.myDeckId) : null)

  if (!gameId) {
    return {
      archetypes: [],
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

  const db = useDb()

  // 1. Tous les archétypes non archivés de l'utilisateur pour ce jeu et cette méta
  const archetypeConditions = [
    eq(archetypes.userId, user.id),
    eq(archetypes.gameId, gameId),
    eq(archetypes.isArchived, false)
  ]

  if (metaId) {
    archetypeConditions.push(eq(archetypes.metaId, metaId))
  }

  const userArchetypes = await db
    .select()
    .from(archetypes)
    .where(and(...archetypeConditions))
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

  // 2. Récupération de tous les matchups existants pour ce deck actif
  const deckMatchups = await db
    .select()
    .from(matchups)
    .where(
      and(
        eq(matchups.userId, user.id),
        eq(matchups.myArchetypeId, myArchetypeId)
      )
    )

  const matchupNotesByOpponent: Record<string, string> = {}
  for (const mu of deckMatchups) {
    matchupNotesByOpponent[mu.opponentArchetypeId] = mu.notes || ''
  }

  // 3. Récupération des matchs pour calcul agrégé (Win Rate & Show Rate)
  const deckMatches = await db
    .select({
      id: matches.id,
      result: matches.result,
      opponentArchetypeId: matchups.opponentArchetypeId
    })
    .from(matches)
    .innerJoin(matchups, eq(matches.matchupId, matchups.id))
    .where(
      and(
        eq(matches.userId, user.id),
        eq(matchups.myArchetypeId, myArchetypeId)
      )
    )

  const totalDeckMatches = deckMatches.length
  let totalWins = 0
  let totalLosses = 0
  let totalDraws = 0

  // Décompte par adversaire
  const statsByOpponentMap: Record<string, { wins: number; losses: number; draws: number; total: number; winrate: number; showRate: number; notes: string }> = {}

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
        showRate: 0,
        notes: matchupNotesByOpponent[m.opponentArchetypeId] || ''
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
    stat.winrate = stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0
    stat.showRate = totalDeckMatches > 0 ? Math.round((stat.total / totalDeckMatches) * 100) : 0
  }

  // S'assurer que tous les archétypes adverses existants ont une entrée (même à 0 match) avec leur note
  for (const arch of userArchetypes) {
    if (!statsByOpponentMap[arch.id]) {
      statsByOpponentMap[arch.id] = {
        wins: 0,
        losses: 0,
        draws: 0,
        total: 0,
        winrate: 0,
        showRate: 0,
        notes: matchupNotesByOpponent[arch.id] || ''
      }
    }
  }

  const overallWinrate = totalDeckMatches > 0 ? Math.round((totalWins / totalDeckMatches) * 100) : 0

  // 4. Historique récent des 50 derniers matchs
  const recentMatchesRaw = await db.query.matches.findMany({
    where: eq(matches.userId, user.id),
    orderBy: [desc(matches.createdAt)],
    limit: 100,
    with: {
      matchup: {
        with: {
          myArchetype: true,
          opponentArchetype: true
        }
      }
    }
  })

  const recentMatches = recentMatchesRaw
    .filter(m => m.matchup && (!myArchetypeId || m.matchup.myArchetypeId === myArchetypeId))
    .slice(0, 50)
    .map(m => ({
      id: m.id,
      userId: m.userId,
      matchupId: m.matchupId,
      result: m.result,
      playedAt: m.playedAt,
      createdAt: m.createdAt,
      myArchetype: m.matchup.myArchetype,
      opponentArchetype: m.matchup.opponentArchetype,
      notes: m.matchup.notes
    }))

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
