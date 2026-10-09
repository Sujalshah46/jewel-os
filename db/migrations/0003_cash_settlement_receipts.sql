CREATE TABLE "payment_counter" (
	"tenant_id" uuid NOT NULL,
	"financial_year" varchar(5) NOT NULL,
	"next_number" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "payment_counter_next_number_nonnegative" CHECK ("payment_counter"."next_number" >= 0)
);
--> statement-breakpoint
ALTER TABLE "invoice_payment" ADD COLUMN "receipt_number" varchar(32);--> statement-breakpoint
ALTER TABLE "invoice_payment" ADD COLUMN "idempotency_key" varchar(128);--> statement-breakpoint
ALTER TABLE "invoice_payment" ADD COLUMN "request_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "payment_counter" ADD CONSTRAINT "payment_counter_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_counter_tenant_fy_key" ON "payment_counter" USING btree ("tenant_id","financial_year");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_payment_tenant_receipt_number_key" ON "invoice_payment" USING btree ("tenant_id","receipt_number") WHERE "invoice_payment"."receipt_number" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_payment_tenant_actor_idempotency_key" ON "invoice_payment" USING btree ("tenant_id","actor_user_id","idempotency_key") WHERE "invoice_payment"."idempotency_key" IS NOT NULL;