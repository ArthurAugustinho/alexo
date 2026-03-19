-- RF de busca com filtros: adiciona brand ao produto para permitir
-- refinamento por marca sem criar tabela dedicada.
ALTER TABLE "product" ADD COLUMN "brand" varchar(100);
