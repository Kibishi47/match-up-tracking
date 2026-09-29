import type { H3Event } from 'h3'
import type { User } from '#auth-utils'

/**
 * Récupère l'utilisateur connecté ou lève une erreur 401 Unauthorized
 */
export async function requireAuthUser(event: H3Event): Promise<User> {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Connexion requise'
    })
  }
  return session.user as User
}

/**
 * Vérifie que l'utilisateur est authentifié et possède le rôle admin, sinon lève une erreur 403 Forbidden
 */
export async function requireAdminUser(event: H3Event): Promise<User> {
  const user = await requireAuthUser(event)
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Privilèges administrateur requis'
    })
  }
  return user
}
