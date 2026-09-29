declare module '#auth-utils' {
  interface User {
    id: string
    discordId: string
    username: string
    avatar?: string | null
    role: 'admin' | 'user'
  }

  interface UserSession {
    user: User
    loggedInAt?: number
  }
}

export {}
