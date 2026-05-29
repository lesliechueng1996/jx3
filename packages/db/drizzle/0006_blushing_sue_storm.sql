CREATE TYPE "public"."raid_run_status" AS ENUM('pending', 'recruiting', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."raid_signup_role" AS ENUM('pending', 'tank', 'healer', 'dps', 'boss');--> statement-breakpoint
CREATE TYPE "public"."raid_signup_status" AS ENUM('pending', 'confirmed', 'waitlist', 'rejected');--> statement-breakpoint
CREATE TABLE "raid_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"dungeon_id" uuid NOT NULL,
	"game_raid_id" text,
	"created_by" text NOT NULL,
	"status" "raid_run_status" DEFAULT 'pending' NOT NULL,
	"gather_time" timestamp with time zone,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"reserved_tank" integer DEFAULT 0 NOT NULL,
	"reserved_healer" integer DEFAULT 0 NOT NULL,
	"reserved_dps" integer DEFAULT 0 NOT NULL,
	"reserved_boss" integer DEFAULT 0 NOT NULL,
	"total_income" numeric(12, 2),
	"wage_per_person" numeric(12, 2),
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raid_signup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raid_run_id" uuid NOT NULL,
	"group_number" integer,
	"position_number" integer,
	"role" "raid_signup_role" DEFAULT 'pending' NOT NULL,
	"status" "raid_signup_status" DEFAULT 'pending' NOT NULL,
	"is_reserved" boolean DEFAULT false NOT NULL,
	"is_leader" boolean DEFAULT false NOT NULL,
	"is_dark_run" boolean DEFAULT false NOT NULL,
	"is_formation_core" boolean DEFAULT false NOT NULL,
	"server_id" uuid,
	"character_name" text,
	"school_id" uuid,
	"kungfu_id" uuid,
	"user_id" text,
	"created_by" text NOT NULL,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_kungfu" ADD COLUMN "is_unlimited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "raid_signup_raid_run_id_idx" ON "raid_signup" USING btree ("raid_run_id");