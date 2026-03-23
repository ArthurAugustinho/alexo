-- CEP de origem opcional por produto para cotacao de frete.
-- Quando NULL, a aplicacao usa MELHOR_ENVIO_CEP_ORIGEM como fallback.
ALTER TABLE "product"
  ADD COLUMN "origin_postal_code" varchar(8);
