-- RF de estoque e novos tamanhos: a coluna size sai do enum para varchar(10)
-- com cast direto usando size::text, preservando o enum historico sem drop.
-- As variantes ja existentes recebem stock inicial derivado de is_available
-- para manter a disponibilidade atual do catalogo.
ALTER TABLE "product_variant" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "product_variant"
SET "stock" = CASE
  WHEN "is_available" THEN 1
  ELSE 0
END;--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "size" SET DATA TYPE varchar(10) USING "size"::text;--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "size" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "is_available" SET DEFAULT false;--> statement-breakpoint
UPDATE "product_variant"
SET "is_available" = "stock" > 0;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_stock_non_negative" CHECK ("product_variant"."stock" >= 0);
