CREATE TYPE "public"."item_quality" AS ENUM('white', 'green', 'blue', 'purple', 'orange');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('equipment', 'special');--> statement-breakpoint
CREATE TABLE "game_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"game_item_id" text,
	"type" "item_type" NOT NULL,
	"quality" "item_quality" NOT NULL,
	"description" text,
	"icon" text,
	"alias" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
