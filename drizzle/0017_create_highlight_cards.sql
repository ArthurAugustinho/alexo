CREATE TABLE "highlight_cards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(100) NOT NULL,
  "image_url" varchar(500) NOT NULL,
  "link_url" varchar(500) NOT NULL,
  "position" integer NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "highlight_cards_position_check" CHECK ("position" >= 1 AND "position" <= 3)
);

CREATE UNIQUE INDEX "highlight_cards_position_unique" ON "highlight_cards" ("position");
CREATE INDEX "highlight_cards_active_position_idx" ON "highlight_cards" ("is_active", "position");
