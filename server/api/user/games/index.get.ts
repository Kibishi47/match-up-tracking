import { eq, asc } from 'drizzle-orm'
import { useDb, userGames, games } from '../../../db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    return []
  }
  const user = session.user as any
  const db = useDb()

  const result = await db
    .select({
      id: games.id,
      name: games.name,
      slug: games.slug,
      logoUrl: games.logoUrl,
      createdAt: games.createdAt,
      updatedAt: games.updatedAt
    })
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(eq(userGames.userId, user.id))
    .orderBy(asc(games.name))

  return result
})
