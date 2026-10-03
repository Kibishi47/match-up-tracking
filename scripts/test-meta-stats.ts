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

    console.log('[PASS] Setup test entities (3 archetypes, 1 meta, 1 game)')

    // 2. Create matchups
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

    // 3. Record matches:
    // Match 1: Player with Deck A vs Deck B -> Win
    const [m1] = await db.insert(matches).values({
      matchupId: muAvsB.id,
      userId: testUserId,
      format: 'bo1',
      result: 'win',
      game1: 'win'
    }).returning()
    createdMatchIds.push(m1.id)

    // Match 2: Player with Deck A vs Deck B -> Loss (BO3 1-2)
    const [m2] = await db.insert(matches).values({
      matchupId: muAvsB.id,
      userId: testUserId,
      format: 'bo3',
      result: 'loss',
      game1: 'win',
      game2: 'loss',
      game3: 'loss'
    }).returning()
    createdMatchIds.push(m2.id)

    // Match 3: Player with Deck A vs Deck C -> Win (BO3 2-0)
    const [m3] = await db.insert(matches).values({
      matchupId: muAvsC.id,
      userId: testUserId,
      format: 'bo3',
      result: 'win',
      game1: 'win',
      game2: 'win'
    }).returning()
    createdMatchIds.push(m3.id)

    // Match 4: Player with Deck B vs Deck C -> Win (BO1)
    const [m4] = await db.insert(matches).values({
      matchupId: muBvsC.id,
      userId: testUserId,
      format: 'bo1',
      result: 'win',
      game1: 'win'
    }).returning()
    createdMatchIds.push(m4.id)

    console.log('[PASS] Recorded 4 matches across various matchups')

    // 4. Query and compute stats logic (same logic as endpoint)
    const metaMatches = await db
      .select({
        id: matches.id,
        result: matches.result,
        myArchetypeId: matchups.myArchetypeId,
        opponentArchetypeId: matchups.opponentArchetypeId
      })
      .from(matches)
      .innerJoin(matchups, eq(matches.matchupId, matchups.id))
      .where(and(eq(matches.userId, testUserId), eq(matchups.metaId, testMetaId)))

    if (metaMatches.length !== 4) {
      throw new Error(`Expected 4 total matches, got ${metaMatches.length}`)
    }

    const winsTotal = metaMatches.filter(m => m.result === 'win').length
    const winrateTotal = Math.round((winsTotal / metaMatches.length) * 100)
    if (winrateTotal !== 75) {
      throw new Error(`Expected 75% overall winrate (3/4), got ${winrateTotal}%`)
    }
    console.log(`[PASS] Meta overall matches: 4, Wins: 3, WR: ${winrateTotal}%`)

    // Deck A: Played = 3 (2W, 1L -> 67% WR), Faced = 0
    const deckAPlayed = metaMatches.filter(m => m.myArchetypeId === deckAId)
    const deckAPlayedWins = deckAPlayed.filter(m => m.result === 'win').length
    const deckAPlayedLosses = deckAPlayed.filter(m => m.result === 'loss').length
    const deckAWR = Math.round((deckAPlayedWins / deckAPlayed.length) * 100)

    if (deckAPlayed.length !== 3 || deckAPlayedWins !== 2 || deckAPlayedLosses !== 1 || deckAWR !== 67) {
      throw new Error(`Deck A played stats mismatch: got ${deckAPlayed.length} matches, ${deckAPlayedWins}W, ${deckAPlayedLosses}L, ${deckAWR}%`)
    }
    console.log(`[PASS] Deck A as played deck: 3 matches, 2W - 1L, ${deckAWR}% WR`)

    // Deck B: Played = 1 (1W -> 100% WR), Faced = 2 (1W, 1L -> 50% WR vs it, 50% Show Rate)
    const deckBPlayed = metaMatches.filter(m => m.myArchetypeId === deckBId)
    const deckBFaced = metaMatches.filter(m => m.opponentArchetypeId === deckBId)
    const deckBFacedWins = deckBFaced.filter(m => m.result === 'win').length
    const deckBShowRate = Math.round((deckBFaced.length / metaMatches.length) * 100)
    const deckBWinrateVs = Math.round((deckBFacedWins / deckBFaced.length) * 100)

    if (deckBPlayed.length !== 1 || deckBFaced.length !== 2 || deckBShowRate !== 50 || deckBWinrateVs !== 50) {
      throw new Error(`Deck B stats mismatch: played=${deckBPlayed.length}, faced=${deckBFaced.length}, showRate=${deckBShowRate}%, winrateVs=${deckBWinrateVs}%`)
    }
    console.log(`[PASS] Deck B: 1 match played (100% WR), 2 matches faced (50% WR vs it, 50% Show Rate)`)

    // Deck C: Faced = 2 (2W, 0L -> 100% WR vs it, 50% Show Rate), Played = 0
    const deckCFaced = metaMatches.filter(m => m.opponentArchetypeId === deckCId)
    const deckCFacedWins = deckCFaced.filter(m => m.result === 'win').length
    const deckCShowRate = Math.round((deckCFaced.length / metaMatches.length) * 100)
    const deckCWinrateVs = Math.round((deckCFacedWins / deckCFaced.length) * 100)

    if (deckCFaced.length !== 2 || deckCFacedWins !== 2 || deckCShowRate !== 50 || deckCWinrateVs !== 100) {
      throw new Error(`Deck C stats mismatch: faced=${deckCFaced.length}, winsVs=${deckCFacedWins}, showRate=${deckCShowRate}%, winrateVs=${deckCWinrateVs}%`)
    }
    console.log(`[PASS] Deck C: 0 matches played, 2 matches faced (100% WR vs it, 50% Show Rate)`)

    console.log('--- All Meta & Archetype Statistics Tests PASSED successfully! ---')
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
