CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"correlation_id" varchar(120) NOT NULL,
	"woovi_charge_id" varchar(120),
	"plan" varchar(16) NOT NULL,
	"value_cents" integer NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payment_link_url" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_correlation_id_unique" UNIQUE("correlation_id")
);
