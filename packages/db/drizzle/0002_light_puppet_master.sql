CREATE TYPE "public"."school_type" AS ENUM('school', 'genre');--> statement-breakpoint
CREATE TYPE "public"."attack_method" AS ENUM('melee', 'ranged');--> statement-breakpoint
CREATE TYPE "public"."attack_type" AS ENUM('internal', 'external');--> statement-breakpoint
CREATE TYPE "public"."kungfu_type" AS ENUM('defense', 'heal', 'attack');--> statement-breakpoint
CREATE TABLE "game_school" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "school_type" NOT NULL,
	"icon" text,
	"alias" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_kungfu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"school_id" uuid NOT NULL,
	"kungfu_type" "kungfu_type" NOT NULL,
	"attack_type" "attack_type",
	"attack_method" "attack_method",
	"formation_effect" text,
	"is_pve_external_recommended" boolean DEFAULT false NOT NULL,
	"is_pve_internal_recommended" boolean DEFAULT false NOT NULL,
	"icon" text,
	"alias" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_kungfu" ADD CONSTRAINT "game_kungfu_school_id_game_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."game_school"("id") ON DELETE no action ON UPDATE no action;