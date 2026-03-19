-- Wishlist por produto: garante no maximo um registro por usuario e produto,
-- com limpeza automatica em cascata quando usuario ou produto forem removidos.
CREATE TABLE "wishlist_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "product_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wishlist_items"
  ADD CONSTRAINT "wishlist_items_user_id_user_id_fk"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."user"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wishlist_items"
  ADD CONSTRAINT "wishlist_items_product_id_product_id_fk"
  FOREIGN KEY ("product_id")
  REFERENCES "public"."product"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_items_user_product_unique"
  ON "wishlist_items" USING btree ("user_id","product_id");
--> statement-breakpoint
CREATE INDEX "wishlist_items_user_id_idx"
  ON "wishlist_items" USING btree ("user_id");
