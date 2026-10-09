CREATE TYPE "public"."membership_role" AS ENUM('OWNER', 'MANAGER', 'CASHIER');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('ADMIN');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_branch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"mobile" varchar(32) NOT NULL,
	"email" varchar(254),
	"address" varchar(300),
	"city" varchar(100),
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"archived_by" text,
	"archived_reason" varchar(240),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_counter" (
	"tenant_id" uuid NOT NULL,
	"financial_year" varchar(5) NOT NULL,
	"next_number" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "invoice_counter_next_number_positive" CHECK ("invoice_counter"."next_number" >= 0)
);
--> statement-breakpoint
CREATE TABLE "invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"stock_item_id" uuid NOT NULL,
	"item_code_snapshot" varchar(80) NOT NULL,
	"description_snapshot" varchar(300) NOT NULL,
	"quantity" integer NOT NULL,
	"gross_weight_mg_snapshot" bigint NOT NULL,
	"net_weight_mg_snapshot" bigint NOT NULL,
	"purity_bps_snapshot" integer NOT NULL,
	"unit_taxable_amount_paise" bigint NOT NULL,
	"unit_cgst_paise" bigint NOT NULL,
	"unit_sgst_paise" bigint NOT NULL,
	"unit_total_paise" bigint NOT NULL,
	"line_taxable_amount_paise" bigint NOT NULL,
	"line_cgst_paise" bigint NOT NULL,
	"line_sgst_paise" bigint NOT NULL,
	"line_total_paise" bigint NOT NULL,
	"pricing_snapshot" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_line_quantity_positive" CHECK ("invoice_line"."quantity" > 0),
	CONSTRAINT "invoice_line_amounts_nonnegative" CHECK ("invoice_line"."unit_taxable_amount_paise" >= 0 AND "invoice_line"."unit_cgst_paise" >= 0 AND "invoice_line"."unit_sgst_paise" >= 0 AND "invoice_line"."unit_total_paise" >= 0 AND "invoice_line"."line_total_paise" >= 0),
	CONSTRAINT "invoice_line_unit_total_reconciles" CHECK ("invoice_line"."unit_total_paise" = "invoice_line"."unit_taxable_amount_paise" + "invoice_line"."unit_cgst_paise" + "invoice_line"."unit_sgst_paise"),
	CONSTRAINT "invoice_line_total_reconciles" CHECK ("invoice_line"."line_total_paise" = "invoice_line"."line_taxable_amount_paise" + "invoice_line"."line_cgst_paise" + "invoice_line"."line_sgst_paise")
);
--> statement-breakpoint
CREATE TABLE "invoice_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"method" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"amount_paise" bigint NOT NULL,
	"reference" varchar(120),
	"actor_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_payment_method_allowed" CHECK ("invoice_payment"."method" IN ('CASH', 'BANK_PENDING', 'OLD_METAL')),
	CONSTRAINT "invoice_payment_status_allowed" CHECK ("invoice_payment"."status" IN ('RECEIVED', 'PENDING')),
	CONSTRAINT "invoice_payment_amount_positive" CHECK ("invoice_payment"."amount_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid,
	"sold_by" text NOT NULL,
	"financial_year" varchar(5) NOT NULL,
	"document_number" varchar(32) NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"business_date" text NOT NULL,
	"issuer_name_snapshot" varchar(160) NOT NULL,
	"taxable_amount_paise" bigint NOT NULL,
	"cgst_paise" bigint NOT NULL,
	"sgst_paise" bigint NOT NULL,
	"total_paise" bigint NOT NULL,
	"outstanding_paise" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_totals_nonnegative" CHECK ("invoice"."taxable_amount_paise" >= 0 AND "invoice"."cgst_paise" >= 0 AND "invoice"."sgst_paise" >= 0 AND "invoice"."total_paise" >= 0 AND "invoice"."outstanding_paise" BETWEEN 0 AND "invoice"."total_paise"),
	CONSTRAINT "invoice_total_reconciles" CHECK ("invoice"."total_paise" = "invoice"."taxable_amount_paise" + "invoice"."cgst_paise" + "invoice"."sgst_paise")
);
--> statement-breakpoint
CREATE TABLE "ledger_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"account_code" varchar(40) NOT NULL,
	"debit_paise" bigint DEFAULT 0 NOT NULL,
	"credit_paise" bigint DEFAULT 0 NOT NULL,
	"actor_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entry_account_allowed" CHECK ("ledger_entry"."account_code" IN ('CASH', 'SCRAP_METAL', 'ACCOUNTS_RECEIVABLE', 'SALES_REVENUE', 'OUTPUT_CGST', 'OUTPUT_SGST')),
	CONSTRAINT "ledger_entry_one_side_positive" CHECK (("ledger_entry"."debit_paise" > 0 AND "ledger_entry"."credit_paise" = 0) OR ("ledger_entry"."credit_paise" > 0 AND "ledger_entry"."debit_paise" = 0))
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "old_metal_receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"metal_type" varchar(24) NOT NULL,
	"gross_weight_mg" bigint NOT NULL,
	"less_weight_mg" bigint NOT NULL,
	"purity_bps" integer NOT NULL,
	"base_rate_paise_per_gram" bigint NOT NULL,
	"deduction_paise_per_gram" bigint NOT NULL,
	"valuation_paise" bigint NOT NULL,
	"actor_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "old_metal_receipt_weights_valid" CHECK ("old_metal_receipt"."gross_weight_mg" >= "old_metal_receipt"."less_weight_mg" AND "old_metal_receipt"."less_weight_mg" >= 0),
	CONSTRAINT "old_metal_receipt_purity_valid" CHECK ("old_metal_receipt"."purity_bps" BETWEEN 1 AND 10000),
	CONSTRAINT "old_metal_receipt_value_nonnegative" CHECK ("old_metal_receipt"."base_rate_paise_per_gram" >= 0 AND "old_metal_receipt"."deduction_paise_per_gram" >= 0 AND "old_metal_receipt"."valuation_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "platform_grant" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" "platform_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"item_code" varchar(80) NOT NULL,
	"barcode" varchar(120),
	"description" varchar(300) NOT NULL,
	"metal_type" varchar(24) NOT NULL,
	"gross_weight_mg" bigint NOT NULL,
	"net_weight_mg" bigint NOT NULL,
	"purity_bps" integer NOT NULL,
	"rate_per_gram_paise" bigint NOT NULL,
	"making_charge_type" varchar(16) NOT NULL,
	"making_charge_value" bigint NOT NULL,
	"making_discount_bps" integer DEFAULT 0 NOT NULL,
	"stone_value_paise" bigint DEFAULT 0 NOT NULL,
	"hallmark_charge_paise" bigint DEFAULT 4500 NOT NULL,
	"other_charges_paise" bigint DEFAULT 0 NOT NULL,
	"item_discount_paise" bigint DEFAULT 0 NOT NULL,
	"gst_rate_bps" integer DEFAULT 300 NOT NULL,
	"quantity_available" integer NOT NULL,
	"catalog_price_paise" bigint NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_item_gross_weight_nonnegative" CHECK ("stock_item"."gross_weight_mg" >= 0),
	CONSTRAINT "stock_item_net_weight_range" CHECK ("stock_item"."net_weight_mg" >= 0 AND "stock_item"."net_weight_mg" <= "stock_item"."gross_weight_mg"),
	CONSTRAINT "stock_item_purity_range" CHECK ("stock_item"."purity_bps" BETWEEN 1 AND 10000),
	CONSTRAINT "stock_item_rate_nonnegative" CHECK ("stock_item"."rate_per_gram_paise" >= 0),
	CONSTRAINT "stock_item_making_type_allowed" CHECK ("stock_item"."making_charge_type" IN ('per_gram', 'fixed', 'percentage')),
	CONSTRAINT "stock_item_making_value_nonnegative" CHECK ("stock_item"."making_charge_value" >= 0),
	CONSTRAINT "stock_item_making_discount_range" CHECK ("stock_item"."making_discount_bps" BETWEEN 0 AND 10000),
	CONSTRAINT "stock_item_charges_nonnegative" CHECK ("stock_item"."stone_value_paise" >= 0 AND "stock_item"."hallmark_charge_paise" >= 0 AND "stock_item"."other_charges_paise" >= 0 AND "stock_item"."item_discount_paise" >= 0),
	CONSTRAINT "stock_item_gst_rate_range" CHECK ("stock_item"."gst_rate_bps" BETWEEN 0 AND 10000),
	CONSTRAINT "stock_item_quantity_nonnegative" CHECK ("stock_item"."quantity_available" >= 0),
	CONSTRAINT "stock_item_price_nonnegative" CHECK ("stock_item"."catalog_price_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"stock_item_id" uuid NOT NULL,
	"movement_type" varchar(24) NOT NULL,
	"quantity_delta" integer NOT NULL,
	"reason" varchar(240) NOT NULL,
	"actor_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movement_quantity_nonzero" CHECK ("stock_movement"."quantity_delta" <> 0),
	CONSTRAINT "stock_movement_type_allowed" CHECK ("stock_movement"."movement_type" IN ('RECEIPT', 'ADJUSTMENT', 'SALE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT'))
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_branch" ADD CONSTRAINT "tenant_branch_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_archived_by_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_counter" ADD CONSTRAINT "invoice_counter_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_tenant_invoice_fk" FOREIGN KEY ("tenant_id","invoice_id") REFERENCES "public"."invoice"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_tenant_stock_item_fk" FOREIGN KEY ("tenant_id","stock_item_id") REFERENCES "public"."stock_item"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_tenant_invoice_fk" FOREIGN KEY ("tenant_id","invoice_id") REFERENCES "public"."invoice"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_sold_by_user_id_fk" FOREIGN KEY ("sold_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenant_branch_fk" FOREIGN KEY ("tenant_id","branch_id") REFERENCES "public"."tenant_branch"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenant_customer_fk" FOREIGN KEY ("tenant_id","customer_id") REFERENCES "public"."customer"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_tenant_invoice_fk" FOREIGN KEY ("tenant_id","invoice_id") REFERENCES "public"."invoice"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "old_metal_receipt" ADD CONSTRAINT "old_metal_receipt_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "old_metal_receipt" ADD CONSTRAINT "old_metal_receipt_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "old_metal_receipt" ADD CONSTRAINT "old_metal_receipt_tenant_invoice_fk" FOREIGN KEY ("tenant_id","invoice_id") REFERENCES "public"."invoice"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_grant" ADD CONSTRAINT "platform_grant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_item" ADD CONSTRAINT "stock_item_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_item" ADD CONSTRAINT "stock_item_tenant_branch_fk" FOREIGN KEY ("tenant_id","branch_id") REFERENCES "public"."tenant_branch"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_tenant_item_fk" FOREIGN KEY ("tenant_id","stock_item_id") REFERENCES "public"."stock_item"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_key" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_branch_tenant_id_key" ON "tenant_branch" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_branch_tenant_name_key" ON "tenant_branch" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "tenant_branch_tenant_active_name_idx" ON "tenant_branch" USING btree ("tenant_id","active","name");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_tenant_id_key" ON "customer" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE INDEX "customer_tenant_archived_name_id_idx" ON "customer" USING btree ("tenant_id","archived","name","id");--> statement-breakpoint
CREATE INDEX "customer_tenant_created_at_idx" ON "customer" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "customer_tenant_updated_at_idx" ON "customer" USING btree ("tenant_id","updated_at");--> statement-breakpoint
CREATE INDEX "customer_tenant_mobile_idx" ON "customer" USING btree ("tenant_id","mobile");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_counter_tenant_fy_key" ON "invoice_counter" USING btree ("tenant_id","financial_year");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_line_tenant_id_key" ON "invoice_line" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE INDEX "invoice_line_tenant_invoice_idx" ON "invoice_line" USING btree ("tenant_id","invoice_id","id");--> statement-breakpoint
CREATE INDEX "invoice_payment_tenant_invoice_idx" ON "invoice_payment" USING btree ("tenant_id","invoice_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_tenant_id_key" ON "invoice" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_tenant_document_number_key" ON "invoice" USING btree ("tenant_id","document_number");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_tenant_soldby_idempotency_key" ON "invoice" USING btree ("tenant_id","sold_by","idempotency_key");--> statement-breakpoint
CREATE INDEX "invoice_tenant_date_id_idx" ON "invoice" USING btree ("tenant_id","business_date","id");--> statement-breakpoint
CREATE INDEX "ledger_entry_tenant_invoice_idx" ON "ledger_entry" USING btree ("tenant_id","invoice_id","id");--> statement-breakpoint
CREATE INDEX "ledger_entry_tenant_account_created_idx" ON "ledger_entry" USING btree ("tenant_id","account_code","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_user_tenant_key" ON "membership" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "membership_tenant_enabled_role_idx" ON "membership" USING btree ("tenant_id","enabled","role");--> statement-breakpoint
CREATE UNIQUE INDEX "old_metal_receipt_tenant_invoice_key" ON "old_metal_receipt" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_item_tenant_id_key" ON "stock_item" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_item_tenant_item_code_key" ON "stock_item" USING btree ("tenant_id","item_code");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_item_tenant_barcode_key" ON "stock_item" USING btree ("tenant_id","barcode");--> statement-breakpoint
CREATE INDEX "stock_item_tenant_branch_archived_code_idx" ON "stock_item" USING btree ("tenant_id","branch_id","archived","item_code");--> statement-breakpoint
CREATE INDEX "stock_movement_tenant_item_created_idx" ON "stock_movement" USING btree ("tenant_id","stock_item_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");