import { and, eq } from 'drizzle-orm'
import { useDb, matchups, archetypes, metas } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const myArchetypeId = body?.myArchetypeId ? String(body.myArchetypeId) : null
  const opponentArchetypeId = body?.opponentArchetypeId ? String(body.opponentArchetypeId) : null
  const notes = body?.notes !== undefined ? String(body.notes) : ''

  if (!myArchetypeId || !opponentArchetypeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'myArchetypeId et opponentArchetypeId sont requis'
    })
  }

  const db = useDb()

  // Vérifier la propriété des deux archétypes
  const [myArch] = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.id, myArchetypeId), eq(archetypes.userId, user.id)))
    .limit(1)

  const [oppArch] = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.id, opponentArchetypeId), eq(archetypes.userId, user.id)))
    .limit(1)

  if (!myArch || !oppArch) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Archétype(s) introuvable(s) ou non autorisé(s)'
    })
  }

  // Déterminer metaId
  let metaId = myArch.metaId || oppArch.metaId
  if (!metaId) {
    const defaultMeta = await db
      .select()
      .from(metas)
      .where(and(eq(metas.userId, user.id), eq(metas.gameId, myArch.gameId)))
      .limit(1)
      .then(rows => rows[0])

    if (!defaultMeta) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucune méta trouvée pour ce jeu'
      })
    }
    metaId = defaultMeta.id
  }

  // Vérifier si le matchup existe déjà
  const [existingMatchup] = await db
    .select()
    .from(matchups)
    .where(
      and(
        eq(matchups.userId, user.id),
        eq(matchups.myArchetypeId, myArchetypeId),
        eq(matchups.opponentArchetypeId, opponentArchetypeId)
      )
    )
    .limit(1)

  let resultMatchup

  if (existingMatchup) {
    const [updated] = await db
      .update(matchups)
      .set({
        notes,
        updatedAt: new Date()
      })
      .where(eq(matchups.id, existingMatchup.id))
      .returning()
    resultMatchup = updated
  } else {
    const [created] = await db
      .insert(matchups)
      .values({
        userId: user.id,
        gameId: myArch.gameId,
        metaId,
        myArchetypeId,
        opponentArchetypeId,
        notes
      })
      .returning()
    resultMatchup = created
  }

  return {
    success: true,
    matchup: resultMatchup
  }
})
