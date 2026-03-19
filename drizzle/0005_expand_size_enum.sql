-- RF02: expandimos o enum mantendo P/M/G para preservar registros existentes.
-- Em PostgreSQL, a estratégia compatível é adicionar novos valores ao tipo sem recriá-lo.
ALTER TYPE "public"."product_variant_size" ADD VALUE 'PP' BEFORE 'P';--> statement-breakpoint
ALTER TYPE "public"."product_variant_size" ADD VALUE 'GG';--> statement-breakpoint
ALTER TYPE "public"."product_variant_size" ADD VALUE 'GGG';
