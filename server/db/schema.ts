import { pgTable, uuid, text, timestamp, boolean, primaryKey, pgEnum, unique, varchar, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Énumérations
export const roleEnum = pgEnum('user_role', ['admin', 'user'])
export const matchResultEnum = pgEnum('match_result', ['win', 'loss', 'draw'])
export const matchFormatEnum = pgEnum('match_format', ['bo1', 'bo3'])

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

// 4. Table Métas (Formats / Sets par utilisateur et par jeu)
export const metas = pgTable('metas', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
  unique('user_game_meta_name_unique').on(table.userId, table.gameId, table.name)
])

// 5. Table Archétypes (Isolés par utilisateur, jeu et rattachés à une méta)
export const archetypes = pgTable('archetypes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  metaId: uuid('meta_id').references(() => metas.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  card1Name: text('card1_name'),
  card1ImageUrl: text('card1_image_url'),
  card2Name: text('card2_name'),
  card2ImageUrl: text('card2_image_url'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
  unique('user_game_meta_archetype_name_unique').on(table.userId, table.gameId, table.metaId, table.name)
])

// 6. Table Matchups (Paires Deck A vs Deck B avec notes partagées)
export const matchups = pgTable('matchups', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  metaId: uuid('meta_id').references(() => metas.id, { onDelete: 'cascade' }).notNull(),
  myArchetypeId: uuid('my_archetype_id').references(() => archetypes.id, { onDelete: 'cascade' }).notNull(),
  opponentArchetypeId: uuid('opponent_archetype_id').references(() => archetypes.id, { onDelete: 'cascade' }).notNull(),
  notes: text('notes').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
  unique('user_matchup_pair_unique').on(table.userId, table.myArchetypeId, table.opponentArchetypeId)
])

// 7. Table Matchs (Enregistrement individuel lié à un matchup)
export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchupId: uuid('matchup_id').references(() => matchups.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  format: matchFormatEnum('format').default('bo1').notNull(),
  result: matchResultEnum('result').notNull(),
  game1: matchResultEnum('game1'),
  game2: matchResultEnum('game2'),
  game3: matchResultEnum('game3'),
  notes: text('notes').default('').notNull(),
  playedAt: timestamp('played_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Relations Drizzle
export const usersRelations = relations(users, ({ many }) => ({
  userGames: many(userGames),
  metas: many(metas),
  archetypes: many(archetypes),
  matchups: many(matchups),
  matches: many(matches)
}))

export const gamesRelations = relations(games, ({ many }) => ({
  userGames: many(userGames),
  metas: many(metas),
  archetypes: many(archetypes),
  matchups: many(matchups)
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

export const metasRelations = relations(metas, ({ one, many }) => ({
  user: one(users, {
    fields: [metas.userId],
    references: [users.id]
  }),
  game: one(games, {
    fields: [metas.gameId],
    references: [games.id]
  }),
  archetypes: many(archetypes),
  matchups: many(matchups)
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
  meta: one(metas, {
    fields: [archetypes.metaId],
    references: [metas.id]
  }),
  myMatchups: many(matchups, { relationName: 'myArchetypeMatchups' }),
  opponentMatchups: many(matchups, { relationName: 'opponentArchetypeMatchups' })
}))

export const matchupsRelations = relations(matchups, ({ one, many }) => ({
  user: one(users, {
    fields: [matchups.userId],
    references: [users.id]
  }),
  game: one(games, {
    fields: [matchups.gameId],
    references: [games.id]
  }),
  meta: one(metas, {
    fields: [matchups.metaId],
    references: [metas.id]
  }),
  myArchetype: one(archetypes, {
    fields: [matchups.myArchetypeId],
    references: [archetypes.id],
    relationName: 'myArchetypeMatchups'
  }),
  opponentArchetype: one(archetypes, {
    fields: [matchups.opponentArchetypeId],
    references: [archetypes.id],
    relationName: 'opponentArchetypeMatchups'
  }),
  matches: many(matches)
}))

export const matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, {
    fields: [matches.userId],
    references: [users.id]
  }),
  matchup: one(matchups, {
    fields: [matches.matchupId],
    references: [matchups.id]
  })
}))

// Types déduits
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
export type UserGame = typeof userGames.$inferSelect
export type Meta = typeof metas.$inferSelect
export type NewMeta = typeof metas.$inferInsert
export type Archetype = typeof archetypes.$inferSelect
export type NewArchetype = typeof archetypes.$inferInsert
export type Matchup = typeof matchups.$inferSelect
export type NewMatchup = typeof matchups.$inferInsert
export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
