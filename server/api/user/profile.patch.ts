import { eq } from 'drizzle-orm'
import { useDb, users } from '../../db'
import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthUser(event)
  const body = await readBody(event)

  const username = typeof body?.username === 'string' ? body.username.trim() : ''

  if (!username || username.length < 2 || username.length > 32) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom d’utilisateur doit contenir entre 2 et 32 caractères.'
    })
  }

  const db = useDb()

  const [updatedUser] = await db
    .update(users)
    .set({
      username,
      updatedAt: new Date()
    })
    .where(eq(users.id, authUser.id))
    .returning()

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur introuvable.'
    })
  }

  // Mettre à jour la session utilisateur chiffrée
  const session = await getUserSession(event)
  await setUserSession(event, {
    ...session,
    user: {
      ...authUser,
      username: updatedUser.username
    }
  })

  return {
    success: true,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      role: updatedUser.role
    }
  }
})
