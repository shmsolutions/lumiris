CREATE TABLE "template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"doc_type" varchar(16) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"definition" jsonb DEFAULT '{"version":1,"sections":[]}'::jsonb NOT NULL,
	"archived_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "template_owner_doctype_idx" ON "template" USING btree ("owner_id","doc_type");