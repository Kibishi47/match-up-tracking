import { and, eq } from 'drizzle-orm'
import { useDb, archetypes } from '../../../database'
import { requireAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const idParam = getRouterParam(event, 'id')
  const archetypeId = parseInt(idParam || '', 10)

  if (isNaN(archetypeId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID d'archétype invalide"
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
