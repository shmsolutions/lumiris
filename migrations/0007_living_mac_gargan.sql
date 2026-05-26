CREATE TABLE "user_profile" (
	"user_id" varchar(64) PRIMARY KEY NOT NULL,
	"crefito" varchar(40),
	"student_name" varchar(120),
	"plan" varchar(16) DEFAULT 'free' NOT NULL,
	"onboarded" boolean DEFAULT false NOT NULL,
	"woovi_subscription_id" varchar(120),
	"subscription_status" varchar(32),
	"current_period_end" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
