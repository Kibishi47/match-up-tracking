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

  const body = await readBody(event)
  const db = useDb()

  const updateData: Record<string, any> = {
    updatedAt: new Date()
  }

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      throw createError({ statusCode: 400, statusMessage: "Le nom de l'archétype est requis" })
    }
    updateData.name = body.name.trim()
  }

  if (body.card1Name !== undefined) updateData.card1Name = body.card1Name ? String(body.card1Name).trim() : null
  if (body.card1ImageUrl !== undefined) updateData.card1ImageUrl = body.card1ImageUrl ? String(body.card1ImageUrl).trim() : null
  if (body.card2Name !== undefined) updateData.card2Name = body.card2Name ? String(body.card2Name).trim() : null
  if (body.card2ImageUrl !== undefined) updateData.card2ImageUrl = body.card2ImageUrl ? String(body.card2ImageUrl).trim() : null
  if (body.isArchived !== undefined) updateData.isArchived = Boolean(body.isArchived)

  const [updated] = await db
    .update(archetypes)
    .set(updateData)
    .where(and(eq(archetypes.id, archetypeId), eq(archetypes.userId, user.id)))
    .returning()

  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: "Archétype introuvable ou non autorisé"
    })
  }

  return updated
})
