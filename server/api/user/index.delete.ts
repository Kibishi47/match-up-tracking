import { eq } from 'drizzle-orm'
import { useDb, users } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthUser(event)
  const body = await readBody(event).catch(() => ({}))

  const confirmation = typeof body?.confirmation === 'string' ? body.confirmation.trim() : ''

  // Valider que la confirmation correspond au pseudo ou au mot clé SUPPRIMER
  if (confirmation !== authUser.username && confirmation !== 'SUPPRIMER') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Confirmation invalide pour la suppression du compte.'
    })
  }

  const db = useDb()

  // Supprime l'utilisateur - la cascade ON DELETE CASCADE supprime user_games, metas, archetypes, matchups, matches
  await db.delete(users).where(eq(users.id, authUser.id))

  // Purge de la session
  await clearUserSession(event)

  return {
    success: true,
    message: 'Compte supprimé avec succès.'
  }
})
