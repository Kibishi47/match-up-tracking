ALTER TABLE "metas" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "notes" text DEFAULT '' NOT NULL;
