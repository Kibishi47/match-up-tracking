CREATE TABLE IF NOT EXISTS "matchups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"meta_id" uuid NOT NULL,
	"my_archetype_id" uuid NOT NULL,
	"opponent_archetype_id" uuid NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_matchup_pair_unique" UNIQUE("user_id","my_archetype_id","opponent_archetype_id")
);
--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_my_archetype_id_archetypes_id_fk" FOREIGN KEY ("my_archetype_id") REFERENCES "public"."archetypes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_opponent_archetype_id_archetypes_id_fk" FOREIGN KEY ("opponent_archetype_id") REFERENCES "public"."archetypes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Migration des données existantes : créer les matchups pour les matchs existants
INSERT INTO "matchups" ("user_id", "game_id", "meta_id", "my_archetype_id", "opponent_archetype_id", "notes", "created_at", "updated_at")
SELECT 
    m."user_id",
    m."game_id",
    COALESCE(a."meta_id", (SELECT id FROM "metas" WHERE "user_id" = m."user_id" AND "game_id" = m."game_id" LIMIT 1)) AS "meta_id",
    m."my_archetype_id",
    m."opponent_archetype_id",
    COALESCE(MAX(m."notes"), '') AS "notes",
    MIN(m."created_at") AS "created_at",
    now() AS "updated_at"
FROM "matches" m
LEFT JOIN "archetypes" a ON a."id" = m."my_archetype_id"
GROUP BY m."user_id", m."game_id", a."meta_id", m."my_archetype_id", m."opponent_archetype_id"
ON CONFLICT ("user_id", "my_archetype_id", "opponent_archetype_id") DO NOTHING;
--> statement-breakpoint
-- Ajout de matchup_id sur matches
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "matchup_id" uuid;
--> statement-breakpoint
UPDATE "matches" m
SET "matchup_id" = mu."id"
FROM "matchups" mu
WHERE m."user_id" = mu."user_id"
  AND m."my_archetype_id" = mu."my_archetype_id"
  AND m."opponent_archetype_id" = mu."opponent_archetype_id"
  AND m."matchup_id" IS NULL;
--> statement-breakpoint
DELETE FROM "matches" WHERE "matchup_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "matchup_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_game_id_games_id_fk";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_my_archetype_id_archetypes_id_fk";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_opponent_archetype_id_archetypes_id_fk";
--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN IF EXISTS "game_id";
--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN IF EXISTS "my_archetype_id";
--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN IF EXISTS "opponent_archetype_id";