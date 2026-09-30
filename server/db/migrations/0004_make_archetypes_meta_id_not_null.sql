-- Créer une méta par défaut pour les jeux ayant des archétypes sans méta
INSERT INTO "metas" ("user_id", "game_id", "name", "is_active")
SELECT DISTINCT a."user_id", a."game_id", 'Méta 1', true
FROM "archetypes" a
WHERE a."meta_id" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "metas" m WHERE m."user_id" = a."user_id" AND m."game_id" = a."game_id"
  );
--> statement-breakpoint
-- Assigner une méta existante aux archétypes qui ont meta_id IS NULL
UPDATE "archetypes" a
SET "meta_id" = (
  SELECT m."id" FROM "metas" m
  WHERE m."user_id" = a."user_id" AND m."game_id" = a."game_id"
  ORDER BY m."created_at" ASC
  LIMIT 1
)
WHERE a."meta_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "archetypes" ALTER COLUMN "meta_id" SET NOT NULL;
