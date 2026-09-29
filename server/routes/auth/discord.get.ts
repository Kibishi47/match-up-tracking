import { eq, sql } from 'drizzle-orm'
import { useDb, users } from '../../db'

const oauthHandler = defineOAuthDiscordEventHandler({
  config: {
    email: false
  },
  async onSuccess(event, { user: discordUser }) {
    const db = useDb()
    const discordId = String(discordUser.id)
    const username = discordUser.username || 'Inconnu'
    const globalName = discordUser.global_name || discordUser.username || null
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png`
      : null

    // 1. Vérifier si l'utilisateur existe déjà
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1)

    let dbUser = existingUsers[0]

    if (!dbUser) {
      // 2. Compter le nombre total d'utilisateurs inscrits
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)

      // Règle du premier inscrit : si la table est vide (count === 0), rôle admin, sinon user
      const assignedRole = count === 0 ? 'admin' : 'user'

      const [newUser] = await db
        .insert(users)
        .values({
          discordId,
          username,
          avatar: avatarUrl,
          role: assignedRole
        })
        .returning()

      dbUser = newUser
    } else {
      // Mettre à jour les infos Discord au cas où elles auraient changé
      const [updatedUser] = await db
        .update(users)
        .set({
          username,
          avatar: avatarUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, dbUser.id))
        .returning()

      dbUser = updatedUser || dbUser
    }

    // 3. Initialiser la session utilisateur chiffrée
    await setUserSession(event, {
      user: {
        id: dbUser.id,
        discordId: dbUser.discordId,
        username: dbUser.username,
        avatar: dbUser.avatar,
        role: dbUser.role
      },
      loggedInAt: Date.now()
    })

    return sendRedirect(event, '/')
  },
  async onError(event, error) {
    console.error('Discord OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_error')
  }
})

export default defineEventHandler(async (event) => {
  const clientId = process.env.NUXT_OAUTH_DISCORD_CLIENT_ID
  const clientSecret = process.env.NUXT_OAUTH_DISCORD_CLIENT_SECRET

  if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
    return sendRedirect(event, '/login?error=missing_credentials')
  }

  return oauthHandler(event)
})
