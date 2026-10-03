DO $$ BEGIN
  CREATE TYPE "public"."match_format" AS ENUM('bo1', 'bo3');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "format" "match_format" DEFAULT 'bo1' NOT NULL;
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "game1" "match_result";
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "game2" "match_result";
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "game3" "match_result";
--> statement-breakpoint
UPDATE "matches" SET "format" = 'bo1', "game1" = "result" WHERE "game1" IS NULL;
