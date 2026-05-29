CREATE TYPE "public"."dungeon_difficulty" AS ENUM('normal', 'heroic', 'challenge');--> statement-breakpoint
CREATE TABLE "game_dungeon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"expansion_id" uuid NOT NULL,
	"player_limit" integer NOT NULL,
	"difficulty" "dungeon_difficulty" NOT NULL,
	"level_requirement" integer NOT NULL,
	"boss_count" integer NOT NULL,
	"reset_weekdays" integer[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_expansion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
