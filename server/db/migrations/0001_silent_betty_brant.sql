CREATE TABLE "metas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_game_meta_name_unique" UNIQUE("user_id","game_id","name")
);
--> statement-breakpoint
ALTER TABLE "archetypes" ADD COLUMN "meta_id" uuid;--> statement-breakpoint
ALTER TABLE "metas" ADD CONSTRAINT "metas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metas" ADD CONSTRAINT "metas_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Migration des données existantes : créer 'Format Initial' pour chaque couple (user, game) présent dans archetypes
INSERT INTO "metas" ("user_id", "game_id", "name", "is_active", "created_at")
SELECT DISTINCT "user_id", "game_id", 'Format Initial', true, now()
FROM "archetypes"
WHERE "meta_id" IS NULL
ON CONFLICT ("user_id", "game_id", "name") DO NOTHING;
--> statement-breakpoint
UPDATE "archetypes" a
SET "meta_id" = m."id"
FROM "metas" m
WHERE a."user_id" = m."user_id" 
  AND a."game_id" = m."game_id" 
  AND m."name" = 'Format Initial'
  AND a."meta_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "archetypes" ADD CONSTRAINT "archetypes_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE cascade ON UPDATE no action;