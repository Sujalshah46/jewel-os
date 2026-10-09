CREATE TABLE "auth_rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"attempts" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_rate_limit_window_idx" ON "auth_rate_limit" USING btree ("window_start");