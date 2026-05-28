ALTER TABLE "payment" ADD COLUMN "asaas_subscription_id" varchar(64);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "tax_id" varchar(20);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "asaas_customer_id" varchar(64);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "asaas_subscription_id" varchar(64);