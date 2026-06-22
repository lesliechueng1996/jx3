CREATE TABLE "player_blocklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_name" text NOT NULL,
	"server_id" uuid NOT NULL,
	"school_id" uuid,
	"remark" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_blocklist_identity_unique" UNIQUE("server_id","character_name")
);
--> statement-breakpoint
CREATE TABLE "raid_brand_blocklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"remark" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raid_brand_blocklist_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "player_blocklist_character_name_idx" ON "player_blocklist" USING btree ("character_name");--> statement-breakpoint
CREATE INDEX "player_blocklist_server_id_idx" ON "player_blocklist" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "raid_brand_blocklist_name_idx" ON "raid_brand_blocklist" USING btree ("name");