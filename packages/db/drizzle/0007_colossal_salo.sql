CREATE TABLE "raid_loot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raid_run_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"winner_signup_id" uuid,
	"price" integer,
	"created_by" text NOT NULL,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "raid_loot_raid_run_id_idx" ON "raid_loot" USING btree ("raid_run_id");--> statement-breakpoint
CREATE INDEX "raid_loot_item_id_idx" ON "raid_loot" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "raid_loot_winner_signup_id_idx" ON "raid_loot" USING btree ("winner_signup_id");