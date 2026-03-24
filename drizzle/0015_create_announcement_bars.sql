CREATE TABLE "announcement_bars" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "text" varchar(255) NOT NULL,
  "link_url" varchar(500),
  "bg_color" varchar(7) NOT NULL DEFAULT '#000000',
  "text_color" varchar(7) NOT NULL DEFAULT '#FFFFFF',
  "is_active" boolean NOT NULL DEFAULT true,
  "start_date" timestamp,
  "end_date" timestamp,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "announcement_bars_dates_check" CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "start_date" < "end_date")
);

CREATE INDEX "announcement_bars_active_dates_idx" ON "announcement_bars" ("is_active", "start_date", "end_date");
