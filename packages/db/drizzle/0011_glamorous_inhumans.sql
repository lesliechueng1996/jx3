CREATE TABLE "game_season" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expansion_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_dungeon" ADD COLUMN "season_id" uuid NOT NULL;