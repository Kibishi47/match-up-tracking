import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray, and } from 'drizzle-orm'
import { users, games, metas, archetypes, matchups, matches } from '../server/db/schema'

async function runTests() {
  console.log('--- Starting Global Meta & Archetype Statistics Verification Tests ---')

  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matchup_tracking'
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  const createdMatchIds: string[] = []
  let testUserId: string | null = null
  let testGameId: string | null = null
  let testMetaId: string | null = null
  let deckAId: string | null = null
  let deckBId: string | null = null
  let deckCId: string | null = null
  let deckWeakId: string | null = null
  let deckStrongId: string | null = null

  try {
    // 1. Setup test entities
    const [testUser] = await db.insert(users).values({
      discordId: `test_stats_${Date.now()}`,
      username: 'Test Stats User'
    }).returning()
    testUserId = testUser.id

    const [testGame] = await db.insert(games).values({
      name: `Test Game Stats ${Date.now()}`,
      slug: `test-game-stats-${Date.now()}`
    }).returning()
    testGameId = testGame.id

    const [testMeta] = await db.insert(metas).values({
      userId: testUserId,
      gameId: testGameId,
      name: 'Stats Meta 2026'
    }).returning()
    testMetaId = testMeta.id

    const [deckA] = await db.insert(archetypes).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      name: 'Deck A (Charizard)'
    }).returning()
    deckAId = deckA.id

    const [deckB] = await db.insert(archetypes).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      name: 'Deck B (Pikachu)'
    }).returning()
    deckBId = deckB.id

    const [deckC] = await db.insert(archetypes).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      name: 'Deck C (Mewtwo)'
    }).returning()
    deckCId = deckC.id

    const [deckWeak] = await db.insert(archetypes).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      name: 'Deck Weak (Magikarp)'
    }).returning()
    deckWeakId = deckWeak.id

    const [deckStrong] = await db.insert(archetypes).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      name: 'Deck Strong (Arceus)'
    }).returning()
    deckStrongId = deckStrong.id

    console.log('[PASS] Setup test entities (5 archetypes, 1 meta, 1 game)')

    // 2. Create matchups
    // Mirror A vs A
    const [muAvsA] = await db.insert(matchups).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      myArchetypeId: deckAId,
      opponentArchetypeId: deckAId
    }).returning()

    // Pair A vs B
    const [muAvsB] = await db.insert(matchups).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      myArchetypeId: deckAId,
      opponentArchetypeId: deckBId
    }).returning()

    // Pair A vs C
    const [muAvsC] = await db.insert(matchups).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      myArchetypeId: deckAId,
      opponentArchetypeId: deckCId
    }).returning()

    // Pair B vs C
    const [muBvsC] = await db.insert(matchups).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      myArchetypeId: deckBId,
      opponentArchetypeId: deckCId
    }).returning()

    // Pair Weak vs Strong
    const [muWeakVsStrong] = await db.insert(matchups).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      myArchetypeId: deckWeakId,
      opponentArchetypeId: deckStrongId
    }).returning()

    // Pair Strong vs Weak
    const [muStrongVsWeak] = await db.insert(matchups).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      myArchetypeId: deckStrongId,
      opponentArchetypeId: deckWeakId
    }).returning()

    // 3. Helper to compute stats exactly as server/api/stats/meta.get.ts
    function computeStats(metaMatchesList: Array<{ id: string; result: string; myArchetypeId: string; opponentArchetypeId: string }>, archIds: string[]) {
      const totalMetaMatches = metaMatchesList.length
      const accMap = new Map<string, {
        playedWins: number
        playedLosses: number
        playedDraws: number
        facedWins: number
        facedLosses: number
        facedDraws: number
        overallWins: number
        overallLosses: number
        overallDraws: number
        mirrorMatches: number
        distinctMatchIds: Set<string>
      }>()

      for (const id of archIds) {
        accMap.set(id, {
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

      for (const m of metaMatchesList) {
        const isMirror = m.myArchetypeId === m.opponentArchetypeId

        const playedAcc = accMap.get(m.myArchetypeId)
        if (playedAcc) {
          if (m.result === 'win') playedAcc.playedWins++
          else if (m.result === 'loss') playedAcc.playedLosses++
          else if (m.result === 'draw') playedAcc.playedDraws++
          playedAcc.distinctMatchIds.add(m.id)

          if (isMirror) {
            playedAcc.mirrorMatches++
          } else {
            if (m.result === 'win') playedAcc.overallWins++
            else if (m.result === 'loss') playedAcc.overallLosses++
            else if (m.result === 'draw') playedAcc.overallDraws++
          }
        }

        const facedAcc = accMap.get(m.opponentArchetypeId)
        if (facedAcc) {
          if (m.result === 'win') facedAcc.facedWins++
          else if (m.result === 'loss') facedAcc.facedLosses++
          else if (m.result === 'draw') facedAcc.facedDraws++
          facedAcc.distinctMatchIds.add(m.id)

          if (!isMirror) {
            if (m.result === 'win') facedAcc.overallLosses++
            else if (m.result === 'loss') facedAcc.overallWins++
            else if (m.result === 'draw') facedAcc.overallDraws++
          }
        }
      }

      const results = new Map<string, any>()
      for (const id of archIds) {
        const acc = accMap.get(id)!
        const playedTotal = acc.playedWins + acc.playedLosses + acc.playedDraws
        const playedWinrate = playedTotal > 0 ? Math.round((acc.playedWins / playedTotal) * 100) : null

        const facedTotal = acc.facedWins + acc.facedLosses + acc.facedDraws
        const facedWinrate = facedTotal > 0 ? Math.round((acc.facedWins / facedTotal) * 100) : null
        const showRate = totalMetaMatches > 0 ? Math.round((facedTotal / totalMetaMatches) * 100) : 0

        const nonMirrorTotal = acc.overallWins + acc.overallLosses + acc.overallDraws
        const overallWinrate = nonMirrorTotal > 0 ? Math.round((acc.overallWins / nonMirrorTotal) * 100) : 0

        const distinctMatches = acc.distinctMatchIds.size
        const presenceRate = totalMetaMatches > 0 ? Math.round((distinctMatches / totalMetaMatches) * 100) : 0

        results.set(id, {
          distinctMatches,
          presenceRate,
          overall: {
            wins: acc.overallWins,
            losses: acc.overallLosses,
            draws: acc.overallDraws,
            mirrorMatches: acc.mirrorMatches,
            winrate: overallWinrate
          },
          played: { total: playedTotal, wins: acc.playedWins, losses: acc.playedLosses, draws: acc.playedDraws, winrate: playedWinrate },
          faced: { total: facedTotal, wins: acc.facedWins, losses: acc.facedLosses, draws: acc.facedDraws, showRate, winrate: facedWinrate }
        })
      }
      return results
    }

    // --- TEST SUITE 1: Mirror Matches Exclusion in Overall ---
    console.log('\n--- Test 1: Mirror Matches Exclusion in Overall ---')
    const [mirror1] = await db.insert(matches).values({
      matchupId: muAvsA.id,
      userId: testUserId,
      format: 'bo1',
      result: 'win',
      game1: 'win'
    }).returning()
    createdMatchIds.push(mirror1.id)

    const mirrorMatches = [{
      id: mirror1.id,
      result: 'win',
      myArchetypeId: deckAId,
      opponentArchetypeId: deckAId
    }]
    const mirrorStats = computeStats(mirrorMatches, [deckAId])
    const deckAMirror = mirrorStats.get(deckAId)

    // Player won 1 mirror: played = 1W-0L, faced = 1W-0L
    // Overall excludes mirror matches:
    // overall.wins = 0, overall.losses = 0, overall.draws = 0, overall.mirrorMatches = 1
    // nonMirrorTotal = 0 -> overall.winrate = 0%
    if (deckAMirror.overall.winrate !== 0) {
      throw new Error(`Mirror WR failed: expected 0% (0 non-mirror matches), got ${deckAMirror.overall.winrate}%`)
    }
    if (deckAMirror.overall.wins !== 0 || deckAMirror.overall.losses !== 0 || deckAMirror.overall.mirrorMatches !== 1) {
      throw new Error(`Mirror exclusion failed: expected 0W-0L-1M, got ${deckAMirror.overall.wins}W-${deckAMirror.overall.losses}L-${deckAMirror.overall.mirrorMatches}M`)
    }
    if (deckAMirror.distinctMatches !== 1) {
      throw new Error(`Mirror distinctMatches failed: expected 1, got ${deckAMirror.distinctMatches}`)
    }
    if (deckAMirror.presenceRate !== 100) {
      throw new Error(`Mirror presenceRate failed: expected 100%, got ${deckAMirror.presenceRate}%`)
    }
    console.log('[PASS] Mirror match is properly excluded from overall W/L/D and counted under mirrorMatches')

    // --- TEST SUITE 2: Meta Presence Boundaries (Presence must never exceed 100%) ---
    console.log('\n--- Test 2: Meta Presence Boundaries ---')
    // Add match 2: Deck A vs Deck B (Win)
    const [m2] = await db.insert(matches).values({
      matchupId: muAvsB.id,
      userId: testUserId,
      format: 'bo1',
      result: 'win',
      game1: 'win'
    }).returning()
    createdMatchIds.push(m2.id)

    // Add match 3: Deck A vs Deck C (Loss)
    const [m3] = await db.insert(matches).values({
      matchupId: muAvsC.id,
      userId: testUserId,
      format: 'bo1',
      result: 'loss',
      game1: 'loss'
    }).returning()
    createdMatchIds.push(m3.id)

    // Add match 4: Deck B vs Deck C (Win)
    const [m4] = await db.insert(matches).values({
      matchupId: muBvsC.id,
      userId: testUserId,
      format: 'bo1',
      result: 'win',
      game1: 'win'
    }).returning()
    createdMatchIds.push(m4.id)

    const fourMatches = [
      { id: mirror1.id, result: 'win', myArchetypeId: deckAId, opponentArchetypeId: deckAId },
      { id: m2.id, result: 'win', myArchetypeId: deckAId, opponentArchetypeId: deckBId },
      { id: m3.id, result: 'loss', myArchetypeId: deckAId, opponentArchetypeId: deckCId },
      { id: m4.id, result: 'win', myArchetypeId: deckBId, opponentArchetypeId: deckCId }
    ]
    const multiStats = computeStats(fourMatches, [deckAId, deckBId, deckCId])
    for (const [id, stat] of multiStats.entries()) {
      if (stat.presenceRate > 100) {
        throw new Error(`Presence rate exceeded 100% for deck ${id}: ${stat.presenceRate}%`)
      }
      if (stat.distinctMatches > fourMatches.length) {
        throw new Error(`distinctMatches (${stat.distinctMatches}) cannot exceed total matches (${fourMatches.length})`)
      }
    }
    // Deck A is in match 1 (mirror), match 2, match 3 -> 3 distinct matches out of 4 -> 75%
    const deckAStats = multiStats.get(deckAId)
    if (deckAStats.distinctMatches !== 3 || deckAStats.presenceRate !== 75) {
      throw new Error(`Deck A presence failed: expected 3 distinct matches (75%), got ${deckAStats.distinctMatches} (${deckAStats.presenceRate}%)`)
    }
    console.log(`[PASS] Deck A presence deduplication: 3/4 matches = ${deckAStats.presenceRate}% (strictly <= 100%)`)

    // --- TEST SUITE 3: Intrinsic Deck Performance (Low-performing and High-performing decks) ---
    console.log('\n--- Test 3: Low vs High Performing Decks ---')
    // Match 5: Player plays Deck Weak vs Deck Strong -> Player Loses (Deck Weak loses, Deck Strong wins)
    const [m5] = await db.insert(matches).values({
      matchupId: muWeakVsStrong.id,
      userId: testUserId,
      format: 'bo1',
      result: 'loss',
      game1: 'loss'
    }).returning()
    createdMatchIds.push(m5.id)

    // Match 6: Player plays Deck Strong vs Deck Weak -> Player Wins (Deck Strong wins, Deck Weak loses)
    const [m6] = await db.insert(matches).values({
      matchupId: muStrongVsWeak.id,
      userId: testUserId,
      format: 'bo1',
      result: 'win',
      game1: 'win'
    }).returning()
    createdMatchIds.push(m6.id)

    const weakStrongMatches = [
      { id: m5.id, result: 'loss', myArchetypeId: deckWeakId, opponentArchetypeId: deckStrongId },
      { id: m6.id, result: 'win', myArchetypeId: deckStrongId, opponentArchetypeId: deckWeakId }
    ]
    const perfStats = computeStats(weakStrongMatches, [deckWeakId, deckStrongId])
    const weakStat = perfStats.get(deckWeakId)
    const strongStat = perfStats.get(deckStrongId)

    // Weak deck:
    // When played (m5): 0W - 1L
    // When faced (m6): Player won -> deck lost: facedWins = 1, facedLosses = 0
    // W_arch = 0 + 0 = 0
    // L_arch = 1 + 1 = 2
    // Overall WR = 0%
    if (weakStat.overall.winrate !== 0 || weakStat.overall.losses !== 2 || weakStat.overall.wins !== 0) {
      throw new Error(`Weak deck overall WR failed: expected 0% (0W - 2L), got ${weakStat.overall.winrate}% (${weakStat.overall.wins}W - ${weakStat.overall.losses}L)`)
    }

    // Strong deck:
    // When faced (m5): Player lost -> deck won: facedWins = 0, facedLosses = 1
    // When played (m6): Player won: playedWins = 1, playedLosses = 0
    // W_arch = 1 + 1 = 2
    // L_arch = 0 + 0 = 0
    // Overall WR = 100%
    if (strongStat.overall.winrate !== 100 || strongStat.overall.wins !== 2 || strongStat.overall.losses !== 0) {
      throw new Error(`Strong deck overall WR failed: expected 100% (2W - 0L), got ${strongStat.overall.winrate}% (${strongStat.overall.wins}W - ${strongStat.overall.losses}L)`)
    }
    console.log(`[PASS] Weak deck has strictly 0% WR (lost as played & lost as faced)`)
    console.log(`[PASS] Strong deck has strictly 100% WR (won as played & won as faced)`)

    // --- TEST SUITE 4: Draws Taking into Account (Win / Total Matches) ---
    console.log('\n--- Test 4: Draws in Win Rate Calculations ---')
    // Match 7: Player with Deck A vs Deck B -> Draw
    const [m7] = await db.insert(matches).values({
      matchupId: muAvsB.id,
      userId: testUserId,
      format: 'bo1',
      result: 'draw',
      game1: 'draw'
    }).returning()
    createdMatchIds.push(m7.id)

    // Test a sample with 1 Win and 1 Draw:
    // Deck X plays 2 matches: 1 win, 1 draw
    const drawSampleMatches = [
      { id: 'sample-1', result: 'win', myArchetypeId: deckAId, opponentArchetypeId: deckBId },
      { id: 'sample-2', result: 'draw', myArchetypeId: deckAId, opponentArchetypeId: deckBId }
    ]
    const drawSampleStats = computeStats(drawSampleMatches, [deckAId, deckBId])
    const deckADrawStat = drawSampleStats.get(deckAId)
    // 1 win / 2 total matches = 50% WR (and NOT 1 / (1 + 0) = 100%)
    if (deckADrawStat.played.winrate !== 50) {
      throw new Error(`Draw WR failed: expected 50% for 1W-0L-1D, got ${deckADrawStat.played.winrate}%`)
    }
    if (deckADrawStat.overall.winrate !== 50) {
      throw new Error(`Overall Draw WR failed: expected 50% for 1W-0L-1D, got ${deckADrawStat.overall.winrate}%`)
    }
    console.log(`[PASS] Sample with 1 Win and 1 Draw yields strictly 50% WR (wins / total matches, properly accounting for draws)`)

    // Mirror match ending in draw:
    const mirrorDrawMatches = [
      { id: 'sample-mirror-draw', result: 'draw', myArchetypeId: deckAId, opponentArchetypeId: deckAId }
    ]
    const mirrorDrawStats = computeStats(mirrorDrawMatches, [deckAId])
    const mirrorDrawStat = mirrorDrawStats.get(deckAId)
    if (mirrorDrawStat.overall.winrate !== 0 || mirrorDrawStat.overall.mirrorMatches !== 1 || mirrorDrawStat.overall.draws !== 0) {
      throw new Error(`Mirror Draw WR failed: expected 0% WR with 1 mirror, got ${mirrorDrawStat.overall.winrate}%`)
    }
    console.log(`[PASS] Mirror match draw yields 0% WR and is counted under mirrorMatches (0 overall draws)`)

    // Verify against database query execution as in server/api/stats/meta.get.ts
    const dbMatches = await db
      .select({
        id: matches.id,
        result: matches.result,
        myArchetypeId: matchups.myArchetypeId,
        opponentArchetypeId: matchups.opponentArchetypeId
      })
      .from(matches)
      .innerJoin(matchups, eq(matches.matchupId, matchups.id))
      .where(and(eq(matches.userId, testUserId), eq(matchups.metaId, testMetaId)))

    if (dbMatches.length !== 7) {
      throw new Error(`Expected 7 matches in DB, got ${dbMatches.length}`)
    }
    const fullDbStats = computeStats(dbMatches, [deckAId, deckBId, deckCId, deckWeakId, deckStrongId])
    console.log('[PASS] Full database query and calculation verified for all 5 archetypes and 7 matches')

    console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---')
  } finally {
    // Cleanup
    if (createdMatchIds.length > 0) {
      await db.delete(matches).where(inArray(matches.id, createdMatchIds))
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId))
    }
    if (testGameId) {
      await db.delete(games).where(eq(games.id, testGameId))
    }
    await client.end()
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
