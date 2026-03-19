CREATE TYPE "public"."product_variant_size" AS ENUM('P', 'M', 'G');--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "size" "product_variant_size" DEFAULT 'M' NOT NULL;