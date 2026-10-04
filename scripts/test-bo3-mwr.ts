import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray } from 'drizzle-orm'
import { users, games, metas, archetypes, matchups, matches } from '../server/db/schema'

async function runTests() {
  console.log('--- Starting BO3 & Match Win Rate (MWR) Verification Tests ---')

  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matchup_tracking'
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  const createdMatchIds: string[] = []
  let testUserId: string | null = null
  let testGameId: string | null = null
  let testMetaId: string | null = null
  let testMyDeckId: string | null = null
  let testOppDeckId: string | null = null
  let testMatchupId: string | null = null

  try {
    // 1. Setup minimal test user and archetypes
    const [testUser] = await db.insert(users).values({
      discordId: `test_bo3_${Date.now()}`,
      username: 'Test BO3 User'
    }).returning()
    testUserId = testUser.id

    const [testGame] = await db.insert(games).values({
      name: `Test Game ${Date.now()}`
    }).returning()
    testGameId = testGame.id

    const [testMeta] = await db.insert(metas).values({
      userId: testUserId,
      gameId: testGameId,
      name: 'Standard BO3 Test'
    }).returning()
    testMetaId = testMeta.id

    const [myDeck] = await db.insert(archetypes).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      name: 'Pikachu ex Test'
    }).returning()
    testMyDeckId = myDeck.id

    const [oppDeck] = await db.insert(archetypes).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      name: 'Charizard ex Test'
    }).returning()
    testOppDeckId = oppDeck.id

    const [testMatchup] = await db.insert(matchups).values({
      userId: testUserId,
      gameId: testGameId,
      metaId: testMetaId,
      myArchetypeId: testMyDeckId,
      opponentArchetypeId: testOppDeckId,
      notes: ''
    }).returning()
    testMatchupId = testMatchup.id

    console.log('[PASS] Setup test entities successfully')

    // 2. Test BO1 insertion
    const [bo1Match] = await db.insert(matches).values({
      userId: testUserId,
      matchupId: testMatchupId,
      format: 'bo1',
      result: 'win',
      game1: 'win',
      game2: null,
      game3: null
    }).returning()
    createdMatchIds.push(bo1Match.id)

    if (bo1Match.format !== 'bo1' || bo1Match.result !== 'win' || bo1Match.game1 !== 'win' || bo1Match.game2 !== null || bo1Match.game3 !== null) {
      throw new Error(`BO1 match insertion failed assertions: ${JSON.stringify(bo1Match)}`)
    }
    console.log('[PASS] BO1 match recorded with format=bo1 and game1=win, game2=null, game3=null')

    // 3. Test BO3 insertion: 2-1 (G1 + G3 win, G2 loss)
    const [bo3Win21] = await db.insert(matches).values({
      userId: testUserId,
      matchupId: testMatchupId,
      format: 'bo3',
      result: 'win',
      game1: 'win',
      game2: 'loss',
      game3: 'win'
    }).returning()
    createdMatchIds.push(bo3Win21.id)

    if (bo3Win21.format !== 'bo3' || bo3Win21.result !== 'win' || bo3Win21.game1 !== 'win' || bo3Win21.game2 !== 'loss' || bo3Win21.game3 !== 'win') {
      throw new Error(`BO3 2-1 match insertion failed assertions: ${JSON.stringify(bo3Win21)}`)
    }
    console.log('[PASS] BO3 2-1 (G1+G3) recorded with format=bo3 and sequence [win, loss, win]')

    // 4. Test BO3 insertion: 1-2 (G1 win, G2 + G3 loss)
    const [bo3Loss12] = await db.insert(matches).values({
      userId: testUserId,
      matchupId: testMatchupId,
      format: 'bo3',
      result: 'loss',
      game1: 'win',
      game2: 'loss',
      game3: 'loss'
    }).returning()
    createdMatchIds.push(bo3Loss12.id)

    if (bo3Loss12.format !== 'bo3' || bo3Loss12.result !== 'loss' || bo3Loss12.game1 !== 'win' || bo3Loss12.game2 !== 'loss' || bo3Loss12.game3 !== 'loss') {
      throw new Error(`BO3 1-2 match insertion failed assertions: ${JSON.stringify(bo3Loss12)}`)
    }
    console.log('[PASS] BO3 1-2 (G1) recorded with format=bo3 and sequence [win, loss, loss]')

    // 5. Test BO3 insertion: 1-1 Draw (Time / G1 win, G2 loss, G3 null)
    const [bo3Draw11] = await db.insert(matches).values({
      userId: testUserId,
      matchupId: testMatchupId,
      format: 'bo3',
      result: 'draw',
      game1: 'win',
      game2: 'loss',
      game3: null
    }).returning()
    createdMatchIds.push(bo3Draw11.id)

    if (bo3Draw11.format !== 'bo3' || bo3Draw11.result !== 'draw' || bo3Draw11.game1 !== 'win' || bo3Draw11.game2 !== 'loss' || bo3Draw11.game3 !== null) {
      throw new Error(`BO3 1-1 Draw match insertion failed assertions: ${JSON.stringify(bo3Draw11)}`)
    }
    console.log('[PASS] BO3 1-1 Draw (Time) recorded with format=bo3 and sequence [win, loss, null]')

    // 6. Verification of Fundamental Statistical Rule: Match Win Rate (MWR)
    // Only test the BO3 2-1 match alone first:
    const singleBo3Query = await db
      .select({ result: matches.result })
      .from(matches)
      .where(eq(matches.id, bo3Win21.id))

    const singleWins = singleBo3Query.filter(m => m.result === 'win').length
    const singleLosses = singleBo3Query.filter(m => m.result === 'loss').length
    const singleTotal = singleBo3Query.length
    const singleWinrate = Math.round((singleWins / singleTotal) * 100)

    if (singleTotal !== 1 || singleWins !== 1 || singleLosses !== 0 || singleWinrate !== 100) {
      throw new Error(`MWR Rule Violation: A BO3 2-1 victory must count as exactly 1 match, 1 win, 0 losses (100% WR), got total=${singleTotal}, wins=${singleWins}, losses=${singleLosses}, winrate=${singleWinrate}%`)
    }
    console.log('[PASS] Single BO3 2-1 win yields exactly 1 match, 1 win, 0 losses (100% MWR, NOT 67%)')

    // Test combined stats: 1 BO3 Win (2-1) + 1 BO3 Loss (1-2) + 1 BO3 Draw (1-1) = 3 matches, 1 win, 1 loss, 1 draw, 33% Win Rate
    const combinedBo3Query = await db
      .select({ result: matches.result })
      .from(matches)
      .where(inArray(matches.id, [bo3Win21.id, bo3Loss12.id, bo3Draw11.id]))

    const combinedWins = combinedBo3Query.filter(m => m.result === 'win').length
    const combinedLosses = combinedBo3Query.filter(m => m.result === 'loss').length
    const combinedDraws = combinedBo3Query.filter(m => m.result === 'draw').length
    const combinedTotal = combinedBo3Query.length
    const combinedWinrate = Math.round((combinedWins / combinedTotal) * 100)

    if (combinedTotal !== 3 || combinedWins !== 1 || combinedLosses !== 1 || combinedDraws !== 1 || combinedWinrate !== 33) {
      throw new Error(`MWR Combined Rule Violation: Expected 3 matches, 1 win, 1 loss, 1 draw (33% WR), got total=${combinedTotal}, wins=${combinedWins}, losses=${combinedLosses}, draws=${combinedDraws}, winrate=${combinedWinrate}%`)
    }
    console.log('[PASS] Combined BO3 matches (1x 2-1 Win + 1x 1-2 Loss + 1x 1-1 Draw) count as 3 matches: 1 Win, 1 Loss, 1 Draw, 33% MWR')

    console.log('--- All BO3 & MWR Consistency Tests PASSED successfully! ---')
  } finally {
    // Cleanup test data
    if (createdMatchIds.length > 0) {
      await db.delete(matches).where(inArray(matches.id, createdMatchIds))
    }
    if (testMatchupId) {
      await db.delete(matchups).where(eq(matchups.id, testMatchupId))
    }
    if (testMyDeckId && testOppDeckId) {
      await db.delete(archetypes).where(inArray(archetypes.id, [testMyDeckId, testOppDeckId]))
    }
    if (testMetaId) {
      await db.delete(metas).where(eq(metas.id, testMetaId))
    }
    if (testGameId) {
      await db.delete(games).where(eq(games.id, testGameId))
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId))
    }
    await client.end()
  }
}

runTests().catch((err) => {
  console.error('[FAIL] Test failed:', err)
  process.exit(1)
})
