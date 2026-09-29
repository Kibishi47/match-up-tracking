import { pgTable, uuid, text, timestamp, boolean, primaryKey, pgEnum, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Énumérations
export const roleEnum = pgEnum('user_role', ['admin', 'user'])
export const matchResultEnum = pgEnum('match_result', ['win', 'loss', 'draw'])

// 1. Table Utilisateurs
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  discordId: text('discord_id').notNull().unique(),
  username: text('username').notNull(),
  avatar: text('avatar'),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 2. Table Jeux (Catalogue global)
export const games = pgTable('games', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 3. Table pivot Utilisateur <-> Jeux
export const userGames = pgTable('user_games', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
  primaryKey({ columns: [table.userId, table.gameId] })
])

// 4. Table Archétypes (100% isolés par utilisateur et par jeu, avec contrainte unique)
export const archetypes = pgTable('archetypes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  card1Name: text('card1_name'),
  card1ImageUrl: text('card1_image_url'),
  card2Name: text('card2_name'),
  card2ImageUrl: text('card2_image_url'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
  unique('user_game_archetype_name_unique').on(table.userId, table.gameId, table.name)
])

// 5. Table Matchs (Enregistrement avec my_archetype_id et opponent_archetype_id)
export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  myArchetypeId: uuid('my_archetype_id').references(() => archetypes.id, { onDelete: 'cascade' }).notNull(),
  opponentArchetypeId: uuid('opponent_archetype_id').references(() => archetypes.id, { onDelete: 'cascade' }).notNull(),
  result: matchResultEnum('result').notNull(),
  notes: text('notes'),
  playedAt: timestamp('played_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Relations Drizzle
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
  myMatches: many(matches, { relationName: 'myMatches' }),
  opponentMatches: many(matches, { relationName: 'opponentMatches' })
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
  myArchetype: one(archetypes, {
    fields: [matches.myArchetypeId],
    references: [archetypes.id],
    relationName: 'myMatches'
  }),
  opponentArchetype: one(archetypes, {
    fields: [matches.opponentArchetypeId],
    references: [archetypes.id],
    relationName: 'opponentMatches'
  })
}))

// Types déduits
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
export type UserGame = typeof userGames.$inferSelect
export type Archetype = typeof archetypes.$inferSelect
export type NewArchetype = typeof archetypes.$inferInsert
export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
