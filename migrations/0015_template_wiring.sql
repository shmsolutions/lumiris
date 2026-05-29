ALTER TABLE "anamnesis" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "anamnesis" ADD COLUMN "values" jsonb;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "values" jsonb;--> statement-breakpoint
ALTER TABLE "session_note" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "session_note" ADD COLUMN "values" jsonb;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "default_templates" jsonb;--> statement-breakpoint
ALTER TABLE "anamnesis" ADD CONSTRAINT "anamnesis_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_note" ADD CONSTRAINT "session_note_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE set null ON UPDATE no action;