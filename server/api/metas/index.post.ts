import { and, desc, eq, sql } from 'drizzle-orm'
import { useDb, metas, archetypes, type Archetype } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  if (!body?.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom de la méta est obligatoire'
    })
  }

  const name = body.name.trim()
  if (name.length > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom de la méta ne peut pas dépasser 100 caractères'
    })
  }

  const gameId = body?.gameId ? String(body.gameId) : null
  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le jeu associé est obligatoire'
    })
  }

  const db = useDb()

  try {
    // Décaler les positions existantes pour placer la nouvelle méta en tête
    await db
      .update(metas)
      .set({ position: sql`${metas.position} + 1` })
      .where(and(eq(metas.userId, user.id), eq(metas.gameId, gameId)))

    const [newMeta] = await db
      .insert(metas)
      .values({
        userId: user.id,
        gameId,
        name,
        position: 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      })
      .returning()

    // Duplication automatique de tous les archétypes dans la nouvelle méta
    let sourceArchetypes: Archetype[] = []

    if (body?.sourceMetaId) {
      sourceArchetypes = await db
        .select()
        .from(archetypes)
        .where(
          and(
            eq(archetypes.userId, user.id),
            eq(archetypes.gameId, gameId),
            eq(archetypes.metaId, String(body.sourceMetaId)),
            eq(archetypes.isArchived, false)
          )
        )
    }

    if (sourceArchetypes.length === 0) {
      const latestMeta = await db
        .select()
        .from(metas)
        .where(
          and(
            eq(metas.userId, user.id),
            eq(metas.gameId, gameId),
            sql`${metas.id} != ${newMeta.id}`
          )
        )
        .orderBy(desc(metas.createdAt))
        .limit(1)
        .then(rows => rows[0])

      if (latestMeta) {
        sourceArchetypes = await db
          .select()
          .from(archetypes)
          .where(
            and(
              eq(archetypes.userId, user.id),
              eq(archetypes.gameId, gameId),
              eq(archetypes.metaId, latestMeta.id),
              eq(archetypes.isArchived, false)
            )
          )
      } else {
        sourceArchetypes = await db
          .select()
          .from(archetypes)
          .where(
            and(
              eq(archetypes.userId, user.id),
              eq(archetypes.gameId, gameId),
              eq(archetypes.isArchived, false)
            )
          )
      }
    }

    if (sourceArchetypes.length > 0) {
      await db.insert(archetypes).values(
        sourceArchetypes.map(a => ({
          userId: user.id,
          gameId,
          metaId: newMeta.id,
          name: a.name,
          card1Name: a.card1Name,
          card1ImageUrl: a.card1ImageUrl,
          card2Name: a.card2Name,
          card2ImageUrl: a.card2ImageUrl,
          isArchived: false
        }))
      )
    }

    return newMeta
  } catch (error: any) {
    // Code 23505 = unique violation sur (userId, gameId, name)
    if (error?.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Une méta avec ce nom existe déjà pour ce jeu'
      })
    }
    throw error
  }
})
