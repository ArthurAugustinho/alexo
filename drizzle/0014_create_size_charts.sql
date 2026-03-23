CREATE TABLE "size_chart" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL,
  "size_label" varchar(10) NOT NULL,
  "bust_min" numeric,
  "bust_max" numeric,
  "waist_min" numeric,
  "waist_max" numeric,
  "hip_min" numeric,
  "hip_max" numeric,
  "height_min" numeric,
  "height_max" numeric,
  "weight_min" numeric,
  "weight_max" numeric,
  "position" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "size_chart"
  ADD CONSTRAINT "size_chart_category_id_category_id_fk"
  FOREIGN KEY ("category_id")
  REFERENCES "public"."category"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "size_chart_category_size_label_unique"
  ON "size_chart" USING btree ("category_id","size_label");
--> statement-breakpoint
CREATE INDEX "size_chart_category_id_idx"
  ON "size_chart" USING btree ("category_id");
