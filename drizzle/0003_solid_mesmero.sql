CREATE TABLE "featured_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "featured_products_product_id_unique" UNIQUE("product_id"),
	CONSTRAINT "featured_products_position_unique" UNIQUE("position")
);
--> statement-breakpoint
ALTER TABLE "seasonal_banner" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "featured_products" ADD CONSTRAINT "featured_products_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;