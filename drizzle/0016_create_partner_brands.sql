CREATE TABLE "partner_brands" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "logo_url" varchar(500) NOT NULL,
  "link_url" varchar(500),
  "is_active" boolean DEFAULT true NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "partner_brands_active_position_idx" ON "partner_brands" ("is_active", "position");
