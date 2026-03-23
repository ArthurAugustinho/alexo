-- Dimensoes e peso opcionais para cotacao de frete via Melhor Envio.
-- Registros existentes permanecem com NULL e a aplicacao usa defaults seguros.
ALTER TABLE "product"
  ADD COLUMN "weight_grams" integer,
  ADD COLUMN "width_cm" integer,
  ADD COLUMN "height_cm" integer,
  ADD COLUMN "length_cm" integer;
