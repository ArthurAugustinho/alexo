-- RF02: a coluna is_available nasce com default true para manter variantes já cadastradas vendáveis.
ALTER TABLE "product_variant" ADD COLUMN "is_available" boolean DEFAULT true NOT NULL;
