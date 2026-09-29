import { and, eq } from 'drizzle-orm'
import { useDb, archetypes } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const archetypeId = getRouterParam(event, 'id')

  if (!archetypeId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID d'archétype requis"
    })
  }

  const query = getQuery(event)
  const db = useDb()

  // Si suppression permanente demandée (?force=true), sinon archivage pour conserver l'historique
  if (query.force === 'true') {
    const [deleted] = await db
      .delete(archetypes)
      .where(and(eq(archetypes.id, archetypeId), eq(archetypes.userId, user.id)))
      .returning()

    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: "Archétype introuvable" })
    }
    return { success: true, deleted }
  } else {
    // Archivage par défaut
    const [archived] = await db
      .update(archetypes)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(archetypes.id, archetypeId), eq(archetypes.userId, user.id)))
      .returning()

    if (!archived) {
      throw createError({ statusCode: 404, statusMessage: "Archétype introuvable" })
    }
    return { success: true, archived }
  }
})
