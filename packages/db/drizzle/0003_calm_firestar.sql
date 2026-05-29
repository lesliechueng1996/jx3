CREATE TYPE "public"."body_type" AS ENUM('male', 'female', 'boy', 'girl');--> statement-breakpoint
CREATE TABLE "game_character" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"game_role_id" text NOT NULL,
	"server_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"body_type" "body_type" NOT NULL,
	"user_id" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_character_server_name_unique" UNIQUE("server_id","name")
);
