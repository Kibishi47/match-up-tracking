import { eq } from 'drizzle-orm'
import { useDb, userGames, games } from '../../database'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const db = useDb()

  const result = await db
    .select({
      game: games,
      joinedAt: userGames.createdAt
    })
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(eq(userGames.userId, user.id))

  return result.map(r => r.game)
})
