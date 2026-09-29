import { pgTable, serial, text, timestamp, boolean, integer, primaryKey, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Rôles utilisateurs
export const roleEnum = pgEnum('user_role', ['admin', 'user'])

// Résultat du match
export const matchResultEnum = pgEnum('match_result', ['win', 'loss'])

// Table Utilisateurs
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  discordId: text('discord_id').notNull().unique(),
  username: text('username').notNull(),
  globalName: text('global_name'),
  avatar: text('avatar'),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Table Jeux (Global & géré par Admin)
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Table pivot Utilisateur <-> Jeux pratiqués
export const userGames = pgTable('user_games', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: integer('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
  primaryKey({ columns: [table.userId, table.gameId] })
])

// Table Archétypes (100% isolés par utilisateur et par jeu)
export const archetypes = pgTable('archetypes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: integer('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  card1Name: text('card1_name'),
  card1ImageUrl: text('card1_image_url'),
  card2Name: text('card2_name'),
  card2ImageUrl: text('card2_image_url'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Table Matchs (Enregistrement des parties)
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: integer('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  userArchetypeId: integer('user_archetype_id').references(() => archetypes.id, { onDelete: 'cascade' }).notNull(),
  opponentArchetypeId: integer('opponent_archetype_id').references(() => archetypes.id, { onDelete: 'cascade' }).notNull(),
  result: matchResultEnum('result').notNull(),
  notes: text('notes'),
  playedAt: timestamp('played_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Relations Drizzle pour faciliter les requêtes relationnelles
export const usersRelations = relations(users, ({ many }) => ({
  userGames: many(userGames),
  archetypes: many(archetypes),
  matches: many(matches)
}))

export const gamesRelations = relations(games, ({ many }) => ({
  userGames: many(userGames),
  archetypes: many(archetypes),
  matches: many(matches)
}))

export const userGamesRelations = relations(userGames, ({ one }) => ({
  user: one(users, {
    fields: [userGames.userId],
    references: [users.id]
  }),
  game: one(games, {
    fields: [userGames.gameId],
    references: [games.id]
  })
}))

export const archetypesRelations = relations(archetypes, ({ one, many }) => ({
  user: one(users, {
    fields: [archetypes.userId],
    references: [users.id]
  }),
  game: one(games, {
    fields: [archetypes.gameId],
    references: [games.id]
  }),
  matchesAsUser: many(matches, { relationName: 'userMatches' }),
  matchesAsOpponent: many(matches, { relationName: 'opponentMatches' })
}))

export const matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, {
    fields: [matches.userId],
    references: [users.id]
  }),
  game: one(games, {
    fields: [matches.gameId],
    references: [games.id]
  }),
  userArchetype: one(archetypes, {
    fields: [matches.userArchetypeId],
    references: [archetypes.id],
    relationName: 'userMatches'
  }),
  opponentArchetype: one(archetypes, {
    fields: [matches.opponentArchetypeId],
    references: [archetypes.id],
    relationName: 'opponentMatches'
  })
}))

// Types TypeScript déduits
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
export type UserGame = typeof userGames.$inferSelect
export type Archetype = typeof archetypes.$inferSelect
export type NewArchetype = typeof archetypes.$inferInsert
export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
